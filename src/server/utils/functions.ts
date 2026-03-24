import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "ffmpeg-static"
import path from "node:path"
import { fileTypeFromBuffer } from "file-type"
import fs from "fs"
import { extension } from "mime-types"
import { GetExtensionFunc } from "src/server/utils/CustomPlaywright/types"


export const getExtension = ((mimeType, backupExtension) => {
    // Remove codecs or extra parameters
    const cleanMime = mimeType.split(";")[0].trim()
    const result = extension(cleanMime)
    if (!result && !!backupExtension) {
        return backupExtension
    }
    return result
}) as GetExtensionFunc

async function getExtensionFromBuffer(buffer: Buffer) {
    const result = await fileTypeFromBuffer(buffer)

    if (!result) return null

    return result.ext
}

export type FFMPEGProgress = {
    frames: number;
    currentFps: number;
    currentKbps: number;
    targetSize: number;
    timemark: string;
    percent?: number | undefined;
}

export type FFMPEGOptionsType = {
    onProgress?: (progress: FFMPEGProgress) => void
}

ffmpeg.setFfmpegPath(ffmpegPath!)
export async function muxStreams(video: Buffer, audio: Buffer, outputPath: string, options?: FFMPEGOptionsType): Promise<any>
export async function muxStreams(videoPath: string, audioPath: string, outputPath: string, options?: FFMPEGOptionsType): Promise<any>
export async function muxStreams(video: Buffer | string, audio: Buffer | string, outputPath: string, options: FFMPEGOptionsType = {}) {
    if (video instanceof Buffer && audio instanceof Buffer) {
        const dir = path.dirname(outputPath)
        const tempDir = path.join(dir, "temp")
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        const randomName = Date.now() + "_" + Math.random().toString(16).slice(2)

        const videoSuffix = await getExtensionFromBuffer(video)
        const audioSuffix = await getExtensionFromBuffer(audio)

        const videoPath = path.join(tempDir, randomName + "_video" + (videoSuffix ? "." : "") + (videoSuffix ?? ""))
        const audioPath = path.join(tempDir, randomName + "_audio" + (audioSuffix ? "." : "") + (audioSuffix ?? ""))

        fs.writeFileSync(videoPath, video)
        fs.writeFileSync(audioPath, audio)

        const result = await muxStreams(videoPath, audioPath, outputPath, options)

        // fs.unlinkSync(videoPath)
        // fs.unlinkSync(audioPath)

        // fs.rmSync(tempDir, { recursive: true, force: true })

        return result
    } else if (video instanceof Buffer || audio instanceof Buffer) {
        throw Error("Video or Audio data type is not correct")
    }
    const videoPath = video as string
    const audioPath = audio as string
    return new Promise((resolve, reject) => {
        console.log("MUXING STARTED...")
        const { onProgress } = options

        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .outputOptions([
                "-c:v copy",
                "-c:a copy"

                // "-c:v copy",
                // "-c:a aac",
                // "-b:a 192k"
            ])
            .save(outputPath)
            .on("start", (cmd) => {
                console.log("FFmpeg start command:", cmd);
            })
            .on("progress", (progress) => {
                onProgress?.(progress)
                // console.log("Processing:", progress.percent ? progress.percent.toFixed(2) + "%" : "");
            })
            .on("end", () => {
                console.log("Muxing finished");
                resolve(true);
            })
            .on("error", (err) => {
                console.error("FFmpeg error:", err);
                reject(err);
            })
    })
}

export class RandomFileName {
    private static saperator = "_"
    static createName(fileSuffix?: string) {
        const name = `${Date.now()}${this.saperator}${Math.random().toString(16).slice(2)}`
        if (fileSuffix) {
            return `${name}.${fileSuffix}`
        }
        return name
    }
    static getDateFromName(name: string) {
        try {
            const date = new Date(Number(name.split(this.saperator)[0]))
            if (date instanceof Date && !isNaN(date.getTime())) {
                return date.toISOString()
            }
        } catch (err) {
            console.log("ERROR GET DATE FROM NAME: ", err)
        }
        return null
    }
}


export class CustomNodeEvent<T> {
    listeners: ((data: T) => void)[]
    constructor() {
        this.listeners = []
    }

    subscribe(callback: typeof this.listeners[0]) {
        if (!this.listeners.includes(callback)) {
            this.listeners.push(callback)
        }

        return () => {
            const index = this.listeners.indexOf(callback)
            if (index >= 0) {
                this.listeners.splice(index, 1)
            }
        }
    }

    dispatch(data: T) {
        this.listeners.forEach((listener) => {
            listener(data)
        })
    }
}