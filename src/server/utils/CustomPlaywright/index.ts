import playwright from "playwright";
import type { Browser, BrowserContext, Page } from "playwright";
import * as path from "node:path";
import * as fs from "node:fs";
import { NetworkItemType } from "src/shared/types";
import { BrowserApiRequest } from "src/server/routers/browser/types";
import { initScript } from "src/server/utils/CustomPlaywright/utils/initScript"
import { spawn } from "child_process"
import { PassLinksType, PassMediaSourceFuncType } from "src/server/utils/CustomPlaywright/types";
import { getExtension, muxStreams } from "src/server/utils/functions";

export type BrowserStatus = "started" | "stopped"

type BrowserStatusChangeCallback = (obj: { status: BrowserStatus }) => void

export type ResultType = {
    pageUrl: string;
    downloadFiles?: { url: string }[];
    result: {
        file: string | null;
        result: {
            network: NetworkItemType[]
        }
    }[]
}

export interface ResponseProgress {
    total: number
    completed: number
    pending: number
}

export class CustomPlaywrightPage {
    private browser: Browser | null = null
    private context: BrowserContext | null = null
    private url: URL | null = null
    private pages: Page[] = []
    private time: { page: Page; start: number; stop: number }[] = []
    private result: ResultType | null = null
    private pendingResponsePromises: Set<Promise<any>> = new Set()

    private totalResponsePromises = 0
    private completedResponsePromises = 0

    private progressListeners: ((progress: ResponseProgress) => void)[] = []

    private onBrowserStatusChangeCallbacks: (BrowserStatusChangeCallback)[] = []

    private playwright_main_folder = path.join(process.cwd(), "src", "server", "utils", "CustomPlaywright")
    private data_folder_path = path.join(this.playwright_main_folder, "data")
    private auth_file_path = path.join(this.data_folder_path, "auth.json")

    private video_folder_path = path.join(process.cwd(), "data", "video")

    private static instange: CustomPlaywrightPage | null = null

    static network_file_name = "network.json"
    static videos_folder_path = "videos"
    static files_folder_path = "files"
    static download_files_folder_path = "downloaded_files"

    private constructor() { }

    static getInstance() {
        if (!CustomPlaywrightPage.instange) {
            CustomPlaywrightPage.instange = new CustomPlaywrightPage()
        }
        return CustomPlaywrightPage.instange
    }

    getStatus(): BrowserStatus {
        return !!this.browser ? "started" : "stopped"
    }

    getOrCreateTimeObj(page: Page) {
        const obj = this.time.find(e => e.page === page)
        if (!obj) {
            const obj = {
                page,
                start: -1,
                stop: -1
            }
            this.time.push(obj)
            return obj
        }
        return obj
    }

    async getOrCreateResultObj(page: Page) {
        const video = page.video()
        if (!video) return null

        const videoPath = await video.path()
        const fileName = path.basename(videoPath)

        const result = this.result?.result.find(e => e.file === fileName) || null

        if (this.result && !result) {
            const obj: ResultType['result'][0] = {
                file: fileName,
                result: {
                    network: []
                }
            }
            this.result.result.push(obj)
            return obj
        }
        return result
    }

    onCustomEvent<T extends any[]>(name: string, callback: (...args: T) => void) {
        if (!this.context) return
        this.context.exposeFunction(name, callback)
    }

    onBrowserStatusChange(callback: BrowserStatusChangeCallback) {
        const index = this.onBrowserStatusChangeCallbacks.push(callback)
        return () => {
            this.onBrowserStatusChangeCallbacks.splice(index, 1)
        }
    }

    public onResponseProgress(
        listener: (progress: ResponseProgress) => void
    ) {
        this.progressListeners.push(listener)
    }

    private emitOnBrowserStatusChangeCallbacks(status: BrowserStatus) {
        this.onBrowserStatusChangeCallbacks.forEach((callback) => {
            callback({ status })
        })
    }

    private emitProgress() {
        const progress: ResponseProgress = {
            total: this.totalResponsePromises,
            completed: this.completedResponsePromises,
            pending: this.totalResponsePromises - this.completedResponsePromises,
        }

        for (const listener of this.progressListeners) {
            listener(progress)
        }
    }

    private async handleResponse(page: typeof this.pages[0], response: playwright.Response, videoPath: string) {
        const request = response.request()
        const responseEnd = request.timing().responseEnd

        const timeObj = this.getOrCreateTimeObj(page)

        const startSeconds = (request.timing().startTime - timeObj.start) / 1000
        const endSeconds =
            ((responseEnd < 0 ? Date.now() : responseEnd) - timeObj.start) / 1000

        const handlePromises = async () => {
            try {
                const data = await response.body();
                const contentType = response.headers()["content-type"] ?? "";

                const mimeType = contentType.split(";")[0].trim();
                // removes charset → "image/svg+xml"

                const subtype = mimeType.split("/")[1] ?? "txt";
                // gets "svg+xml"

                const fileSuffix = subtype.split("+")[0];
                // removes "+xml" → "svg"

                const fileName = `${Date.now()}_${Math.random().toString(16).slice(2)}.${fileSuffix}`
                const filePath = path.join(videoPath, CustomPlaywrightPage.files_folder_path, fileName)
                fs.mkdirSync(path.dirname(filePath), { recursive: true })
                fs.writeFileSync(filePath, data)
                return {
                    url: filePath.replace(process.cwd(), "").replaceAll(/\\/g, "/"),
                    contentType: response.headers()['content-type'] || "application/octet-stream",
                }
            } catch (err) {
                return {
                    error: err instanceof Error ? err.message : String(err)
                }
            }
        }

        const handleFunc = <T extends Function>(f: T) => {
            try {
                return f()
            } catch {
                return null
            }
        }

        // const body = await handlePromises()

        const resultObj = await this.getOrCreateResultObj(page)

        if (resultObj) {
            resultObj.result.network.push({
                startSeconds,
                endSeconds,
                pageUrl: page.url(),
                request: {
                    method: request.method(),
                    url: request.url(),
                    headers: request.headers(),
                    postData: request.postData(),
                    postDataJSON: handleFunc(() => request.postDataJSON()),
                },
                response: {
                    status: response.status(),
                    headers: response.headers(),
                    // body,
                },
            })
        }
    }

    private async startBrowser(obj: { headless?: boolean } = {}) {
        const videoPath = this.getVideoPath()
        if (!videoPath) return {}
        /**
         * create a new folder in 'C:\\Users\\admin\\AppData\\Local\\Google\\Chrome' folder with name 'Playwright User Data'
         * Copy all the data from 'User Data' to 'Playwright User data'
         * Then run the below code
         */
        // const userPath = "C:\\Users\\admin\\AppData\\Local\\Google\\Chrome\\Playwright User Data"
        // const context = await playwright.chromium.launchPersistentContext(userPath, {
        //     headless: obj.headless ?? false,
        //     channel: "chrome",
        //     recordVideo: {
        //         dir: path.join(videoPath, CustomPlaywrightPage.videos_folder_path)
        //     }
        // })
        // const browser = context.browser()

        // const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        // const userDataDir = this.data_folder_path
        // const PORT = 9222

        // console.log("Launching Chrome...");

        // const browserProcess = spawn(chromePath, [
        //     `--remote-debugging-port=${PORT}`,
        //     `--user-data-dir=${userDataDir}`,
        //     `--no-first-run`,
        //     `--no-default-browser-check`
        // ], {
        //     detached: true, // Allows the browser to stay open if the script crashes
        //     stdio: 'ignore'
        // });

        // browserProcess.unref();

        // await new Promise((resolve) => setTimeout(resolve, 5000))

        // const browser = await playwright.chromium.connectOverCDP(`http://localhost:${PORT}`)
        // const context = await browser.newContext({
        //     recordVideo: {
        //         dir: path.join(videoPath, CustomPlaywrightPage.videos_folder_path)
        //     }
        // })


        const browser = await playwright.chromium.launch({
            headless: obj.headless ?? false,
            channel: "chrome"
        })
        const context = await browser.newContext({
            recordVideo: {
                dir: path.join(videoPath, CustomPlaywrightPage.videos_folder_path)
            },
            storageState: this.hasAuthFile() ? this.auth_file_path : undefined
        })
        return { browser, context }
    }


    private async start() {
        // const { videoFolder } = obj
        const videoFolder = this.getFolderName()
        if (!videoFolder) return
        // const videoPath = path.join(this.video_folder_path, videoFolder)
        const videoPath = this.getVideoPath()
        if (!videoPath) return

        const obj = await this.startBrowser()
        if (obj.browser) {
            this.browser = obj.browser
        }
        if (obj.context) {
            this.context = obj.context
        }
        if (!this.browser || !this.context) return

        try {
            fs.rmSync(videoPath, { recursive: true, force: true })
        } catch (err) {
            console.log("error in rmdir: ", err)
            console.log(videoPath)
        }
        fs.mkdirSync(videoPath, { recursive: true })


        // this.context = await playwright.chromium.launchPersistentContext("C:\\Users\\admin\\AppData\\Local\\Google\\Chrome\\'User Data'", {
        //     channel: "chrome",
        //     headless: false,
        //     recordVideo: {
        //         dir: path.join(videoPath, CustomPlaywrightPage.videos_folder_path)
        //     }
        // })
        await this.context.addInitScript(initScript)

        const saveToDownloadsFolder = (bytes: Uint8Array, obj: { fileName?: string; fileSuffix?: string } = {}) => {
            const { fileName, fileSuffix } = obj
            const randomName = `${Date.now()}_${Math.random().toString(16).slice(2)}`
            const fixFileName = fileName ? fileName : fileSuffix ? `${randomName}.${fileSuffix}` : randomName

            const filePath = path.join(videoPath, CustomPlaywrightPage.download_files_folder_path, fixFileName)
            const dirPath = path.dirname(filePath)
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true })
            }
            fs.writeFileSync(filePath, bytes)
        }

        this.context.exposeFunction("passLinks", (async (data) => {
            console.log("Starting to download files...")
            for (let i = 0; i < data.length; i++) {
                const obj = data[i]
                console.log(`File ${i + 1} is started...`)
                try {
                    if (obj.type === "blob" || obj.type === "file" || !obj.type) {
                        const res = await fetch(obj.link)

                        // const arrayBuffer = await res.arrayBuffer()
                        const bytes = await res.bytes()

                        const contentType = res.headers.get('content-type') ?? ""

                        const mimeType = contentType.split(";")[0].trim();
                        // removes charset → "image/svg+xml"

                        const subtype = mimeType.split("/")[1] ?? "txt";
                        // gets "svg+xml"

                        const fileSuffix = subtype.split("+")[0];
                        // removes "+xml" → "svg"

                        saveToDownloadsFolder(bytes, { fileSuffix })
                        console.log(`File ${i + 1} downloaded...`)
                    } else {
                        console.log(`File ${i + 1}, type is not supported ${obj.type}, ${obj.link}`)
                    }
                } catch (err) {
                    console.log(`File ${i + 1} ERROR: `, obj)
                }
            }
        }) as PassLinksType)

        this.context.exposeFunction("passMediaSource", (async (data) => {
            for (const key in data) {
                const obj = data[key]
                console.log("MEDIA SOURCE URL: ", key, obj.readyState)

                const audioChunks: Uint8Array<ArrayBuffer>[] = []
                const videoChunks: Uint8Array<ArrayBuffer>[] = []

                let audioMimeType: string | undefined
                let videoMimeType: string | undefined
                obj.data.forEach((e) => {
                    if (e.mimeType.includes("video")) {
                        videoMimeType = e.mimeType
                        videoChunks.push(new Uint8Array(e.data))
                    } else if (e.mimeType.includes("audio")) {
                        audioMimeType = e.mimeType
                        audioChunks.push(new Uint8Array(e.data))
                    }
                })

                if (videoChunks.length > 0 && audioChunks.length > 0) {
                    const audioSuffix = getExtension(audioMimeType!, "mp3")
                    const videoSuffix = getExtension(videoMimeType!, "mp4")

                    console.log("AUDIO SUFFIX: ", audioSuffix)
                    console.log("VIDEO SUFFIX: ", videoSuffix)

                    const audioBlob = new Blob(audioChunks, { type: `audio/${audioSuffix}` })
                    const videoBlob = new Blob(videoChunks, { type: `video/${videoSuffix}` })

                    const audioArrayBuffer = await audioBlob.arrayBuffer()
                    const videoArrayBuffer = await videoBlob.arrayBuffer()

                    const outputPath = path.join(videoPath, CustomPlaywrightPage.download_files_folder_path, `${Date.now()}_${Math.random().toString(16).slice(2)}.${videoSuffix}`)

                    await muxStreams(Buffer.from(videoArrayBuffer), Buffer.from(audioArrayBuffer), outputPath)
                }

                else if (audioChunks.length > 0) {
                    const suffix = getExtension(audioMimeType!, 'mp3')
                    const audioBlob = new Blob(audioChunks, { type: `audio/${suffix}` })
                    const audioArrayBuffer = await audioBlob.arrayBuffer()
                    saveToDownloadsFolder(Buffer.from(audioArrayBuffer), { fileSuffix: suffix })
                }

                else if (videoChunks.length > 0) {
                    const suffix = getExtension(videoMimeType!, "mp4")
                    const videoBlob = new Blob(videoChunks, { type: `video/${suffix}` })
                    const videoArrayBuffer = await videoBlob.arrayBuffer()
                    saveToDownloadsFolder(Buffer.from(videoArrayBuffer), { fileSuffix: suffix })
                }
            }
        }) as PassMediaSourceFuncType)

        this.context.addListener("console", (consoleMessage) => {
            console.log("CONSOLE LOG MESSAGE: ", consoleMessage.text())
        })
        this.context.addListener("page", async (page) => {
            this.pages.push(page)

            const timeObj = this.getOrCreateTimeObj(page)
            timeObj.start = Date.now()

            if (!this.result) {
                this.result = {
                    pageUrl: videoFolder,
                    result: []
                }
            }

            await this.getOrCreateResultObj(page)

            page.addListener("response", async (response) => {
                const promise = this.handleResponse(page, response, videoPath)

                this.totalResponsePromises++
                this.pendingResponsePromises.add(promise)

                this.emitProgress()

                promise
                    .finally(() => {
                        this.pendingResponsePromises.delete(promise)
                        this.completedResponsePromises++
                        this.emitProgress()
                    })
            })

            page.addListener("close", () => {
                const index = this.pages.findIndex(item => item === page)
                if (index >= 0) {
                    this.pages.splice(index, 1)
                }

                const timeObj = this.getOrCreateTimeObj(page)
                timeObj.stop = Date.now()
            })
        })
        await this.context?.newPage()

        this.emitOnBrowserStatusChangeCallbacks("started")
        // this.context.addListener("close", async () => {
        //     await Promise.allSettled([...this.pendingResponsePromises])

        //     fs.writeFileSync(path.join(videoPath, CustomPlaywrightPage.network_file_name), JSON.stringify(this.result, undefined, 4), { encoding: 'utf-8' })

        //     this.reset()
        // })
        this.browser.addListener("disconnected", async () => {
            await Promise.allSettled([...this.pendingResponsePromises])

            fs.writeFileSync(path.join(videoPath, CustomPlaywrightPage.network_file_name), JSON.stringify(this.result, undefined, 4), { encoding: 'utf-8' })

            this.reset()
        })
    }

    public getFolderName() {
        if (!this.url) return null

        return this.url.hostname
    }

    public getVideoPath() {
        const folderName = this.getFolderName()
        if (!folderName) return null

        return path.join(this.video_folder_path, folderName)
    }

    async goto(url: string) {
        if (this.getStatus() === "started") return
        this.url = new URL(url)

        await this.start()
        if (this.pages.length === 0) return
        const page = this.pages[0]
        await page.goto(url)
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
        this.pages = []
        this.time = []
        this.result = null
        this.emitOnBrowserStatusChangeCallbacks("stopped")
    }

    async close() {
        if (this.getStatus() === "stopped") return

        this.time = this.time.map(e => ({ ...e, stop: e.stop < 0 ? Date.now() : e.stop }))

        console.log(this.time.map(e => ((e.stop - e.start) / 1000) + " seconds").join(", "))
        await this.storeState()
        await Promise.allSettled([...this.pendingResponsePromises])
        for (let i = 0; i < this.pages.length; i++) {
            const page = this.pages[i]
            if (page) await page.close()
        }
        await this.context?.close()
        await this.browser?.close()
    }
}