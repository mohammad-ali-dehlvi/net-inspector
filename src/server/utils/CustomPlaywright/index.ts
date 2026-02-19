import playwright from "playwright";
import type { Browser, BrowserContext, Page } from "playwright";
import * as path from "node:path";
import * as fs from "node:fs";
import { NetworkItemType } from "src/shared/types";
import { BrowserApiRequest } from "src/server/routers/browser/types";

export type BrowserStatus = "started" | "stopped"

type BrowserStatusChangeCallback = (obj: { status: BrowserStatus }) => void

export class CustomPlaywrightPage {
    private browser: Browser | null = null
    private context: BrowserContext | null = null
    private page: Page | null = null
    private url: URL | null = null
    private time: { start: number; stop: number } = { start: -1, stop: -1 }
    private result: NetworkItemType[] = []

    private onBrowserStatusChangeCallbacks: (BrowserStatusChangeCallback)[] = []

    private data_folder_path = path.join(process.cwd(), "src", "server", "utils", "CustomPlaywright", "data")
    private auth_file_path = path.join(this.data_folder_path, "auth.json")

    private video_folder_path = path.join(process.cwd(), "data", "video")

    private static instange: CustomPlaywrightPage | null = null

    static network_file_name = "network.json"

    private constructor() { }

    static getInstange() {
        if (!CustomPlaywrightPage.instange) {
            CustomPlaywrightPage.instange = new CustomPlaywrightPage()
        }
        return CustomPlaywrightPage.instange
    }

    getStatus(): BrowserStatus {
        return !!this.browser ? "started" : "stopped"
    }

    onBrowserStatusChange(callback: BrowserStatusChangeCallback) {
        const index = this.onBrowserStatusChangeCallbacks.push(callback)
        return () => {
            this.onBrowserStatusChangeCallbacks.splice(index, 1)
        }
    }

    private async start(obj: { videoFolder: string }) {
        const { videoFolder } = obj
        const videoPath = path.join(this.video_folder_path, videoFolder)

        try {
            fs.rmSync(videoPath, { recursive: true, force: true })
        } catch (err) {
            console.log("error in rmdir: ", err)
            console.log(videoPath)
        }
        fs.mkdirSync(videoPath, { recursive: true })

        this.browser = await playwright.chromium.launch({ headless: false })
        this.context = await this.browser.newContext({
            // recordHar: {
            //     path: path.join(videoPath, "network_1.har"),
            //     content: "embed"
            // },
            recordVideo: {
                dir: videoPath
            },
            storageState: this.hasAuthFile() ? this.auth_file_path : undefined
        })
        this.page = await this.context?.newPage()

        const handlePromises = async <T extends any>(p: (() => Promise<T>)[]) => {
            const errors: any[] = []
            for (let i = 0; i < p.length; i++) {
                try {
                    const promise = p[i]
                    const data = await promise()
                    if (data instanceof Buffer) {
                        return data.toString("base64")
                    }
                    return data
                } catch (err) {
                    errors.push(err)
                    return undefined
                }
            }
            return errors
        }
        const handleFunc = <T extends Function>(f: T) => { try { return f() } catch (err) { return null } }

        this.page.addListener("response", async (response) => {
            const request = response.request();

            const responseEnd = request.timing().responseEnd

            const startSeconds = (request.timing().startTime - this.time.start) / 1000; // epoch ms
            const endSeconds = ((responseEnd < 0 ? Date.now() : responseEnd) - this.time.start) / 1000;

            this.result.push({
                startSeconds: startSeconds,
                endSeconds: endSeconds,
                pageUrl: this.page?.url(),
                request: {
                    method: request.method(),
                    url: request.url(),
                    headers: request.headers(),
                    postData: request.postData(),
                    postDataJSON: handleFunc(request.postDataJSON)
                },
                response: {
                    status: response.status(),
                    headers: response.headers(),
                    body: await handlePromises([() => response.json(), () => response.body(), () => response.text()])
                }
            });
        })

        this.onBrowserStatusChangeCallbacks.forEach((callback) => {
            callback({ status: "started" })
        })

        this.browser.addListener("disconnected", async () => {
            fs.writeFileSync(path.join(videoPath, CustomPlaywrightPage.network_file_name), JSON.stringify({ pageUrl: this.url?.href, requests: this.result }, undefined, 4), { encoding: 'utf-8' })
            this.reset()
        })
    }

    async goto(url: string) {
        if (this.getStatus() === "started") return
        const u = new URL(url)
        this.url = u
        await this.start({ videoFolder: u.hostname })
        if (!this.page) return
        this.time.start = Date.now()
        await this.page.goto(url)
    }

    private hasAuthFile() {
        return fs.existsSync(this.auth_file_path)
    }

    private async storeState() {
        fs.mkdirSync(this.data_folder_path, { recursive: true })

        await this.context?.storageState({ path: this.auth_file_path })
    }

    async request(data: BrowserApiRequest) {
        const browser = await playwright.chromium.launch({ headless: true })
        const page = await browser.newPage({
            storageState: this.hasAuthFile() ? this.auth_file_path : undefined
        })
        if (data.pageUrl) {
            await page.goto(data.pageUrl)
        }

        const res = await page.request.fetch(data.request.url, {
            data: data.request.postData,
            method: data.request.method,
            headers: data.request.headers
        })

        const responses: { type: "json" | "text" | "buffer"; data: () => Promise<any> }[] = [
            { type: "json", data: () => res.json() },
            { type: "buffer", data: () => res.body() },
            { type: "text", data: () => res.text() },
        ]

        const contentType = res.headers()['content-type']
        const response = await (async () => {
            for (let i = 0; i < responses.length; i++) {
                const response = responses[i]
                try {
                    const data = await response.data()
                    return { type: response.type, data, contentType }
                } catch (err) {
                    console.log("Error handling response type:", response.type, err)
                }
            }
            return { type: null, data: null }
        })()

        await page.close()
        await browser.close()

        return response
    }

    reset() {
        this.browser = null
        this.context = null
        this.page = null
        this.url = null
        this.time = { start: -1, stop: -1 }
        this.result = []
        this.onBrowserStatusChangeCallbacks.forEach((callback) => {
            callback({ status: "stopped" })
        })
    }

    async close() {
        if (this.getStatus() === "stopped") return
        this.time.stop = Date.now()
        console.log((this.time.stop - this.time.start) / 1000, " seconds")
        await this.storeState()
        await this.page?.close()
        await this.context?.close()
        await this.browser?.close()
    }
}