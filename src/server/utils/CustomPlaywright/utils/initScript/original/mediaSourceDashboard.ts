import { PassLinksDataType, PassLinksMediaSourceDataType, PassMediaSourceDataType } from "../../../types";
import { Highlighter } from "./highlighter";

export class MediaSourceDashboard {
    mediaSourceMap: Map<MediaSource, PassLinksMediaSourceDataType<ArrayBuffer>> = new Map()
    urlMap: Map<string, { type: PassLinksDataType['type'] | "mediasource"; instance: MediaSource | Blob | File }> = new Map()
    elements: { [key: string]: HTMLElement } = {}
    constructor() { }

    async appendArrayBuffer(sb: SourceBuffer, arrayBuffer: BufferSource) {
        const promise = new Promise<"done">((resolve, reject) => {
            sb.addEventListener("updateend", () => {
                resolve("done")
            }, { once: true })
            sb.appendBuffer(arrayBuffer)
        })

        return await promise
    }

    setMediaSource(ms: MediaSource) {
        const { mediaSourceMap } = this
        if (!mediaSourceMap.has(ms)) {
            mediaSourceMap.set(ms, {
                sourceBuffers: [],
                data: []
            })
        }
        const eventHandler = () => {
            if (!document.body) {
                document.addEventListener("DOMContentLoaded", eventHandler, { once: true })
                return
            }
            this.renderHTML(document.body)
        }
        ms.addEventListener("sourceopen", eventHandler)
        ms.addEventListener("sourceclose", eventHandler)
        ms.addEventListener("sourceended", eventHandler)
    }

    setSourceBuffer(sb: SourceBuffer) {
        const { mediaSourceMap } = this

        if ("__parentMediaSource" in sb) {
            const ms = sb.__parentMediaSource as MediaSource

            this.setMediaSource(ms)

            const obj = mediaSourceMap.get(ms)!
            if (!obj.sourceBuffers.includes(sb)) {
                obj.sourceBuffers.push(sb)
            }
        }
    }

    serializeMediaSourceMap() {
        const { mediaSourceMap } = this
        const mediaSourceArr = Array.from(mediaSourceMap.keys())
        const result: { data: { mimeType: string; buffer: Uint8Array }[] }[] = []
        for (let mediaSource of mediaSourceArr) {
            const obj = mediaSourceMap.get(mediaSource)!
            result.push({
                // ...obj,
                data: obj.data.map(e => ({ ...e, buffer: new Uint8Array(e.data.slice(0)) }))
            })
        }
        return result
    }

    setArrayBuffer(sb: SourceBuffer, arrayBuffer: ArrayBuffer) {
        const { mediaSourceMap } = this
        const sourceBufferObj = mediaSourceMap.values().find(e => e.sourceBuffers.includes(sb))

        if (sourceBufferObj && "mimeType" in sb && typeof sb.mimeType === "string" && "__parentMediaSource" in sb) {
            sourceBufferObj.data.push({ mimeType: sb.mimeType, data: arrayBuffer })
            // serializeMediaSourceMap()
        }
    }

    async sendToExpress() {
        const { urlMap, mediaSourceMap } = this
        const data: PassLinksDataType[] = [];

        const splitHighlightedInstances = () => {
            const arr = Highlighter.instances
            const normalHighlighters: Highlighter[] = []
            const mediaSourceHighlighters: Highlighter[] = []

            for (let i = 0; i < arr.length; i++) {
                const obj = arr[i]
                const link = obj.getLink()
                if (!link) continue
                const urlObj = urlMap.get(link)
                if (urlObj?.type !== "mediasource") {
                    normalHighlighters.push(obj)
                } else if (urlObj.instance instanceof MediaSource) {
                    mediaSourceHighlighters.push(obj)
                }
            }
            return { normalHighlighters, mediaSourceHighlighters }
        }
        const { normalHighlighters, mediaSourceHighlighters } = splitHighlightedInstances()

        window.passLinks(normalHighlighters.map((e) => {
            const link = e.getLink()!
            const urlObj = urlMap.get(link)

            return {
                link,
                pageUrl: location.href,
                type: !urlObj ? undefined : urlObj.type as Exclude<typeof urlObj.type, "mediasource">
            }
        }))

        console.log("MEDIA SOURCE PROMISE STARTED...")
        const start = Date.now()
        const mediaSourceData = await Promise.all(mediaSourceHighlighters.map((obj) => {
            const link = obj.getLink()!
            const urlObj = urlMap.get(link)!
            const ms = urlObj.instance as MediaSource
            const checkReadyState = (ms: MediaSource) => {
                if (ms.readyState === "closed" || ms.readyState === "ended") {
                    const data = mediaSourceMap.get(ms)
                    return data ? {
                        link,
                        readyState: ms.readyState,
                        data: data.data.map((e) => {
                            return {
                                ...e,
                                data: new Uint8Array(e.data)
                            }
                        })
                    } : undefined
                }
                return undefined
            }

            const result = checkReadyState(ms)

            if (result) {
                return result
            }

            const promise = new Promise<{ link: string; readyState: ReadyState; data: PassLinksMediaSourceDataType<Uint8Array>['data'] } | undefined>((resolve) => {
                const handleResolve = () => {
                    console.log("ONE OF MEDIA SOURCE is completed...")
                    resolve(checkReadyState(ms))
                }
                ms.addEventListener("sourceclose", handleResolve, { once: true })
                ms.addEventListener("sourceended", handleResolve, { once: true })
            })

            return promise
        }))
        console.log("MEDIA SOURCE PROMISE COMPLETED...", (Date.now() - start) / 1000, "seconds")
        console.log(mediaSourceData.map(e => e ? e.data.length : "NO DATA").join(", "))

        window.passMediaSource(mediaSourceData.reduce((acc, curr) => {
            if (curr) {
                const { link, readyState, data } = curr

                acc[link] = {
                    readyState,
                    data
                }
            }
            return acc
        }, {} as PassMediaSourceDataType))
    }

    renderHTML(parent?: HTMLElement) {
        const { mediaSourceMap, elements } = this

        const container = elements.container || document.createElement("div")
        const mainText = elements.mainText || document.createElement("p")
        const openMSText = elements.openMSText || document.createElement("span")
        const closeMSText = elements.closeMSText || document.createElement("span")
        const endedMSText = elements.endedMSText || document.createElement("span")
        const downloadAnchor = (elements.downloadAnchor || document.createElement("a")) as HTMLAnchorElement
        this.elements = { container, mainText, openMSText, closeMSText, endedMSText, downloadAnchor }

        container.appendChild(mainText)
        container.appendChild(downloadAnchor)
        mainText.appendChild(openMSText)
        mainText.appendChild(closeMSText)
        mainText.appendChild(endedMSText)

        if (parent && parent.children) {
            parent.appendChild(container)
        }

        container.style.position = "fixed"
        container.style.bottom = "0px"
        container.style.right = "0px"
        container.style.padding = "5px 10px"
        container.style.zIndex = "99999"
        container.style.background = "white"
        container.style.transition = "0.5s"
        container.style.transform = "translateY(calc(100% - 5px))"
        container.onmouseover = () => { container.style.transform = "translateY(0px)" }
        container.onmouseout = () => { container.style.transform = "translateY(calc(100% - 5px))" }

        mainText.style.fontWeight = "700"
        mainText.style.color = "black"

        openMSText.style.color = "green"

        closeMSText.style.color = "red"

        const mediaSourceArr = Array.from(mediaSourceMap.keys())

        const obj = mediaSourceArr.reduce((acc, curr) => {
            if (curr.readyState === "closed") {
                acc.close.push(curr)
            } else if (curr.readyState === "ended") {
                acc.ended.push(curr)
            } else if (curr.readyState === "open") {
                acc.open.push(curr)
            }

            return acc
        }, { open: [] as MediaSource[], close: [] as MediaSource[], ended: [] as MediaSource[] })

        const createTitle = (arr: MediaSource[]) => arr.length > 0 ? arr.map(e => e.duration + 's').join(", ") : ""
        openMSText.innerText = `${obj.open.length} Open`
        openMSText.title = createTitle(obj.open)
        closeMSText.innerText = `${obj.close.length} Closed`
        closeMSText.title = createTitle(obj.close)
        endedMSText.innerText = `${obj.ended.length} Ended`
        endedMSText.title = createTitle(obj.ended)

        // if (!testVideo.src) {

        // }
        downloadAnchor.innerText = "Download"
        downloadAnchor.download = "file.mp4"
        if (obj.ended.length > 0) {
            const ms = obj.ended[0]
            const data = mediaSourceMap.get(ms)!
            const buffers: ArrayBuffer[] = []
            for (let i = 0; i < data.data.length; i++) {
                const item = data.data[i]
                if (item.mimeType.includes("video")) {
                    buffers.push(item.data.slice(0))
                }
            }
            const blob = new Blob(buffers, { type: "video/mp4" })
            const url = URL.createObjectURL(blob)

            downloadAnchor.href = url
        }
    }

}