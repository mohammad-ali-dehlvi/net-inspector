import type { MediaSourceDataType, NormalDataType, HighlightObj, PassLinksDataType, PassLinksMediaSourceDataType } from "src/server/utils/CustomPlaywright/types";
import { Highlighter } from "./highlighter";
import { downloadProgressDispatchEvent } from "./customEventCreator"

export class MediaSourceDashboard {
    mediaSourceMap: Map<MediaSource, PassLinksMediaSourceDataType<ArrayBuffer>> = new Map()
    urlMap: Map<string, { type: PassLinksDataType['type']; instance: MediaSource | Blob | File }> = new Map()
    elements: { [key: string]: HTMLElement } = {}
    constructor() { }

    setMediaSource(ms: MediaSource) {
        const { mediaSourceMap } = this
        if (!mediaSourceMap.has(ms)) {
            mediaSourceMap.set(ms, {
                sourceBuffers: [],
                data: []
            })
        }
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

        if (sourceBufferObj && "mimeType" in sb && typeof sb.mimeType === "string") {
            sourceBufferObj.data.push({ mimeType: sb.mimeType, data: arrayBuffer })
            // serializeMediaSourceMap()
        }
    }

    async sendToExpress() {
        const { urlMap, mediaSourceMap } = this

        const getUid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`

        const splitHighlightedInstances = () => {
            const arr = Highlighter.instances
            const normalHighlighters: { e: Highlighter; index: number }[] = []
            const mediaSourceHighlighters: { e: Highlighter; index: number }[] = []

            for (let i = 0; i < arr.length; i++) {
                const obj = arr[i]
                const link = obj.getLink()
                if (!link) continue
                const urlObj = urlMap.get(link)
                if (urlObj?.type !== "mediasource") {
                    normalHighlighters.push({ e: obj, index: i })
                } else if (urlObj.instance instanceof MediaSource) {
                    mediaSourceHighlighters.push({ e: obj, index: i })
                }
            }
            return { normalHighlighters, mediaSourceHighlighters }
        }
        const { normalHighlighters, mediaSourceHighlighters } = splitHighlightedInstances()

        const getNormalFiles = async () => {
            return await Promise.all(normalHighlighters.map(async (item, i): Promise<NormalDataType | null> => {
                const { e, index } = item
                console.log("NORMAL FILE DOWNLOAD")
                try {
                    const link = e.getLink()!
                    const urlObj = urlMap.get(link)

                    if (!urlObj?.type || urlObj.type === "blob" || urlObj.type === "file") {
                        const result = await this.downloadWithProgress(
                            link,
                            {
                                onProgress: (data) => {
                                    downloadProgressDispatchEvent({ [index]: data })
                                }
                            }
                        )

                        if (!result) {
                            console.log("ERROR result is null for: ", link)
                            return null
                        }

                        const { blob, response: res } = result

                        const contentType = res.headers.get('content-type') ?? ""

                        const mimeType = contentType.split(";")[0].trim();
                        // removes charset → "image/svg+xml"

                        const subtype = mimeType.split("/")[1] ?? "txt";
                        // gets "svg+xml"

                        const fileSuffix = subtype.split("+")[0];
                        // removes "+xml" → "svg"

                        // const uid = getUid()
                        // window._blobs[uid] = blob;

                        return {
                            type: "normal" as "normal",
                            url: URL.createObjectURL(blob),
                            // uid,
                            fileSuffix
                        }
                    } else {
                        console.log(`File type is not supported ${urlObj.type}, ${link}`)
                    }
                } catch (err) {
                    console.log(`File ERROR: `, (err as Error).message)
                }
                return null
            }))
        }

        const getMediaSourceFiles = async () => {
            return await Promise.all(mediaSourceHighlighters.map(async (item) => {
                const { e, index } = item
                const link = e.getLink()!
                console.log("MEDIA SOURCE download: ", link)
                this.mediaSourceProgress(link, {
                    onProgress: (data) => {
                        downloadProgressDispatchEvent({
                            [index]: data
                        })
                    }
                })
                const urlObj = urlMap.get(link)!
                const ms = urlObj.instance as MediaSource
                const checkReadyState = async (ms: MediaSource): Promise<MediaSourceDataType | undefined> => {
                    try {
                        if (ms.readyState === "closed" || ms.readyState === "ended") {
                            const data = mediaSourceMap.get(ms)
                            if (data) {
                                const audioChunks: Uint8Array<ArrayBuffer>[] = []
                                const videoChunks: Uint8Array<ArrayBuffer>[] = []

                                let audioMimeType: string | undefined
                                let videoMimeType: string | undefined
                                data.data.forEach((e) => {
                                    if (e.mimeType.includes("video")) {
                                        videoMimeType = e.mimeType
                                        videoChunks.push(new Uint8Array(e.data))
                                    } else if (e.mimeType.includes("audio")) {
                                        audioMimeType = e.mimeType
                                        audioChunks.push(new Uint8Array(e.data))
                                    }
                                })

                                const videoObj = await (async () => {
                                    if (videoChunks.length > 0) {
                                        const videoSuffix = await window.getExtension(videoMimeType!, "mp4")

                                        console.log("VIDEO SUFFIX: ", videoSuffix)

                                        const blob = new Blob(videoChunks, { type: `video/${videoSuffix}` })

                                        // const uid = getUid()

                                        // window._blobs[uid] = blob

                                        const url = URL.createObjectURL(blob)

                                        return { blob, url }
                                    }
                                    return null
                                })()


                                const audioObj = await (async () => {
                                    if (audioChunks.length > 0) {
                                        const audioSuffix = await window.getExtension(audioMimeType!, "mp3")

                                        console.log("AUDIO SUFFIX: ", audioSuffix)

                                        const blob = new Blob(audioChunks, { type: `audio/${audioSuffix}` })

                                        // const uid = getUid()

                                        // window._blobs[uid] = blob

                                        const url = URL.createObjectURL(blob)

                                        return { blob, url }
                                    }
                                    return null
                                })()
                                const result = data ? {
                                    type: "mediasource" as "mediasource",
                                    data: {
                                        audio: audioObj ? {
                                            // bytes: new Uint8Array(await audioBlob.arrayBuffer()),
                                            // url: URL.createObjectURL(audioBlob),
                                            url: audioObj.url,
                                            fileSuffix: audioObj.blob.type.split("/").at(-1)
                                        }
                                            : null,
                                        video: videoObj ? {
                                            // bytes: new Uint8Array(await videoBlob.arrayBuffer()),
                                            // url: URL.createObjectURL(videoBlob),
                                            url: videoObj.url,
                                            fileSuffix: videoObj.blob.type.split("/").at(-1)
                                        }
                                            : null
                                    }
                                } : undefined

                                console.log("FINAL MS RESULT: ", result)
                                return result
                            }
                        }
                    } catch (err) {
                        console.log("ERROR IN CHECK READY STATE: ", (err as Error).message)
                    }
                    return undefined
                }

                const result = await checkReadyState(ms)
                console.log("MS RESULT: ", result)
                if (result) {
                    return result
                }

                const promise = new Promise<ReturnType<typeof checkReadyState> | undefined>((resolve) => {
                    const handleResolve = () => {
                        console.log("ONE OF MEDIA SOURCE is completed...")
                        setTimeout(async () => {
                            const result = await checkReadyState(ms)
                            resolve(checkReadyState(ms))
                        }, 500)
                    }
                    ms.addEventListener("sourceclose", handleResolve, { once: true })
                    ms.addEventListener("sourceended", handleResolve, { once: true })
                })

                return await promise
            }))
        }

        const finalResult = (await Promise.all([getNormalFiles(), getMediaSourceFiles()]))

        const formattedResult: (NormalDataType | MediaSourceDataType)[] = []

        for (let i = 0; i < finalResult.length; i++) {
            for (let j = 0; j < finalResult[i].length; j++) {
                const data = finalResult[i][j]
                if (!!data) {
                    formattedResult.push(data)
                }
            }
        }

        console.log("FORMATTED RESULT: ", formattedResult)

        window.passData(formattedResult)
    }

    private mediaSourceProgress(link: string, options: {
        onProgress?: (data: HighlightObj) => void
    } = {}) {
        const { onProgress } = options
        let ele = document.querySelector(`video[src="${link}"]`)
        if (!ele) {
            ele = document.querySelector(`audio[src="${link}"]`)
        }
        if (!ele) {
            ele = document.querySelector(`img[src="${link}"]`)
        }
        console.log("MEDIA SOURCE ELEMENT: ", ele)
        if (ele && ele instanceof HTMLMediaElement) {
            ele.addEventListener("progress", () => {
                if (ele.buffered.length > 0) {
                    const loaded = ele.buffered.end(ele.buffered.length - 1);
                    const total = ele.duration;
                    const percentCompleted = (loaded / total) * 100;
                    onProgress?.call({}, {
                        loaded,
                        total,
                        percentCompleted
                    })
                }
            })
        } else {
            console.log("NO ELEMENT found: ", link)
        }
    }

    private async downloadWithProgress(
        link: string,
        options: {
            onProgress?: (data: HighlightObj) => void
        } = {}
    ) {
        const { onProgress } = options
        const response = await fetch(link);

        // 1. Get the total size from headers
        const contentLength = response.headers.get('content-length');
        const total = contentLength !== null ? parseInt(contentLength, 10) : null;
        let loaded = 0;

        // 2. Initialize the reader
        const reader = response.body?.getReader();
        const chunks = []; // Store chunks to reconstruct the file later

        if (!reader) return null

        // 3. Read the data stream
        while (true) {
            const { done, value } = await reader.read();

            if (done) break;

            chunks.push(value);
            loaded += value.length;

            // 4. Calculate and log progress
            const percentCompleted = typeof total === "number" ? (loaded / total) * 100 : null;
            onProgress?.call({}, { total, loaded, percentCompleted })
        }

        // 5. Combine chunks into a single Blob
        const blob = new Blob(chunks);
        // const bytes = await blob.bytes()

        return {
            blob,
            response
        }
    }

}