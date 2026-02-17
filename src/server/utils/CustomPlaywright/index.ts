import playwright from "playwright";
import type { Browser, BrowserContext, Page } from "playwright";
import * as path from "node:path";
import * as fs from "node:fs";
import { NetworkItemType } from "src/shared/types";

type TempObjType = {
    method: NetworkItemType['method'];
    headers: NetworkItemType['headers'];
    post_data: NetworkItemType['post_data']; 
    // post_data_buffer: Buffer<ArrayBufferLike> | null; 
    post_data_json: NetworkItemType['post_data_json'];
    start_seconds: NetworkItemType['start_seconds']
}

export type BrowserStatus = "started" | "stopped"

type BrowserStatusChangeCallback = (obj: {status: BrowserStatus})=>void

export class CustomPlaywrightPage {
    private browser: Browser | null = null
    private context: BrowserContext | null = null
    private page: Page | null = null
    private url: URL | null = null
    private time: {start: number; stop: number} = {start: -1, stop: -1}
    private result: NetworkItemType[] = []
    private onBrowserStatusChangeCallbacks: (BrowserStatusChangeCallback)[] = []
    private data_folder_path = path.join(process.cwd(), "src", "server", "utils", "CustomPlaywright", "data")
    private auth_file_path = path.join(this.data_folder_path, "auth.json")
    private static instange: CustomPlaywrightPage | null = null
    static network_file_name = "network.json"

    private constructor() {}

    static getInstange() {
        if (!CustomPlaywrightPage.instange){
            CustomPlaywrightPage.instange = new CustomPlaywrightPage()
        }
        return CustomPlaywrightPage.instange
    }

    getStatus(): BrowserStatus {
        return !!this.browser ? "started": "stopped"
    }

    onBrowserStatusChange(callback: BrowserStatusChangeCallback){
        const index = this.onBrowserStatusChangeCallbacks.push(callback)
        return ()=>{
            this.onBrowserStatusChangeCallbacks.splice(index, 1)
        }
    }

    private async start(obj: {videoFolder: string}){
        const { videoFolder } = obj
        const videoPath = path.join(process.cwd(), "data", "video", videoFolder)

        try{
            // fs.rmdirSync(videoPath)
            fs.rmSync(videoPath, {recursive: true, force: true})
        }catch(err){
            console.log("error in rmdir: ", err)
            console.log(videoPath)
        }
        fs.mkdirSync(videoPath, {recursive: true})

        this.browser = await playwright.chromium.launch({headless: false})
        this.context = await this.browser.newContext({
            recordVideo: {
                dir: videoPath
            },
            storageState: this.hasAuthFile() ? this.auth_file_path : undefined
        })
        this.page = await this.context?.newPage()

        const tempObj: Record<string, TempObjType> = {}

        this.page.addListener("request", (req)=>{
            // console.log("Request: ", req.method(), req.headers(), req.url())
            const url = req.url()
            tempObj[url] = {
                method: req.method(),
                headers: req.headers(),
                post_data: req.postData(),
                // post_data_buffer: req.postDataBuffer(),
                post_data_json: (()=>{try{return req.postDataJSON();}catch(err){return null;}})(),
                start_seconds: (Date.now() - this.time.start)/1000
            }
        })
        this.page.addListener("response",async (res)=>{
            // console.log("Request: ", res.status(), res.headers(), res.url())
            const url = res.url()
            this.result.push({
                url,
                end_seconds: (Date.now() - this.time.start)/1000,
                ...tempObj[url]
            })
        })

        this.onBrowserStatusChangeCallbacks.forEach((callback) => {
            callback({status: "started"})
        })

        
        this.browser.addListener("disconnected", ()=>{
            fs.writeFileSync(path.join(videoPath, CustomPlaywrightPage.network_file_name), JSON.stringify({pageUrl: this.url?.href, requests: this.result}, undefined, 4), {encoding: 'utf-8'})
            this.reset()
        })
    }

    async goto(url: string) {
        if (this.getStatus() === "started") return
        const u = new URL(url)
        this.url = u
        await this.start({videoFolder: u.hostname})
        if (!this.page) return
        this.time.start = Date.now()
        await this.page.goto(url)
    }

    private hasAuthFile() {
        return fs.existsSync(this.auth_file_path)
    }

    private async storeState() {
        fs.mkdirSync(this.data_folder_path, {recursive: true})

        await this.context?.storageState({path: this.auth_file_path})
    }

    async request(data: NetworkItemType) {
        const browser = await playwright.chromium.launch({headless: true})
        const page = await browser.newPage()

        const res = await page.request.fetch(data.url, {
            data: data.post_data,
            method: data.method,
            headers: data.headers
        })

        const responses = [
            res.json(),
            res.text(),
            res.body(),
        ]

        const response = await (async () => {
            for(let i=0;i<responses.length;i++){
                const response = responses[i]
                try{
                    const data = await response
                    return data
                }catch(err){
    
                }
            }
            return null
        })()

        return response
    }

    reset(){
        this.browser = null
        this.context = null
        this.page = null
        this.url = null
        this.time = {start: -1, stop: -1}
        this.result = []
        this.onBrowserStatusChangeCallbacks.forEach((callback)=>{
            callback({status: "stopped"})
        })
    }

    async close(){
        if (this.getStatus() === "stopped") return
        this.time.stop = Date.now()
        console.log((this.time.stop - this.time.start)/1000, " seconds")
        await this.storeState()
        this.page?.close()
        this.context?.close()
        this.browser?.close()
    }
}