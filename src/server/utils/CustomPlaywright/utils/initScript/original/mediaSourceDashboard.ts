import type { MediaSourceDataType, NormalDataType, PassLinksDataType, PassLinksMediaSourceDataType } from "src/server/utils/CustomPlaywright/types";
import { Highlighter } from "./highlighter";

export class MediaSourceDashboard {
    mediaSourceMap: Map<MediaSource, PassLinksMediaSourceDataType<ArrayBuffer>> = new Map()
    urlMap: Map<string, { type: PassLinksDataType['type']; instance: MediaSource | Blob | File }> = new Map()
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

        const getNormalFiles = async () => {
            return await Promise.all(normalHighlighters.map(async (e): Promise<NormalDataType | null> => {
                try {
                    const link = e.getLink()!
                    const urlObj = urlMap.get(link)

                    if (!urlObj?.type || urlObj.type === "blob" || urlObj.type === "file") {
                        const res = await fetch(link)

                        const bytes = await res.bytes()

                        const contentType = res.headers.get('content-type') ?? ""

                        const mimeType = contentType.split(";")[0].trim();
                        // removes charset → "image/svg+xml"

                        const subtype = mimeType.split("/")[1] ?? "txt";
                        // gets "svg+xml"

                        const fileSuffix = subtype.split("+")[0];
                        // removes "+xml" → "svg"

                        return {
                            type: "normal" as "normal",
                            bytes,
                            fileSuffix
                        }
                    } else {
                        console.log(`File type is not supported ${urlObj.type}, ${link}`)
                    }
                } catch (err) {
                    console.log(`File ERROR: `, e)
                }
                return null
            }))
        }

        const getMediaSourceFiles = async () => {
            return await Promise.all(mediaSourceHighlighters.map((e) => {
                const link = e.getLink()!
                const urlObj = urlMap.get(link)!
                const ms = urlObj.instance as MediaSource
                const checkReadyState = async (ms: MediaSource): Promise<MediaSourceDataType | undefined> => {
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

                            const videoBlob = await (async () => {
                                if (videoChunks.length > 0) {
                                    const videoSuffix = await window.getExtension(videoMimeType!, "mp4")

                                    console.log("VIDEO SUFFIX: ", videoSuffix)

                                    return new Blob(videoChunks, { type: `video/${videoSuffix}` })
                                }
                                return null
                            })()


                            const audioBlob = await (async () => {
                                if (audioChunks.length > 0) {
                                    const audioSuffix = await window.getExtension(audioMimeType!, "mp3")

                                    console.log("AUDIO SUFFIX: ", audioSuffix)

                                    return new Blob(audioChunks, { type: `audio/${audioSuffix}` })
                                }
                                return null
                            })()
                            return data ? {
                                type: "mediasource" as "mediasource",
                                data: {
                                    audio: audioBlob ?
                                        {
                                            bytes: new Uint8Array(await audioBlob.arrayBuffer()),
                                            fileSuffix: audioBlob.type.split("/").at(-1)
                                        } : null,
                                    video: videoBlob ?
                                        {
                                            bytes: new Uint8Array(await videoBlob.arrayBuffer()),
                                            fileSuffix: videoBlob.type.split("/").at(-1)
                                        } : null
                                }
                            } : undefined
                        }
                        return undefined
                    }
                }

                const result = checkReadyState(ms)

                if (result) {
                    return result
                }

                const promise = new Promise<ReturnType<typeof checkReadyState> | undefined>((resolve) => {
                    const handleResolve = () => {
                        console.log("ONE OF MEDIA SOURCE is completed...")
                        setTimeout(() => {
                            resolve(checkReadyState(ms))
                        }, 500)
                    }
                    ms.addEventListener("sourceclose", handleResolve, { once: true })
                    ms.addEventListener("sourceended", handleResolve, { once: true })
                })

                return promise
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

        window.passData(formattedResult)
    }

}