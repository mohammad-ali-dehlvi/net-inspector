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


ffmpeg.setFfmpegPath(ffmpegPath!)
export async function muxStreams(video: Buffer, audio: Buffer, outputPath: string): Promise<any>
export async function muxStreams(videoPath: string, audioPath: string, outputPath: string): Promise<any>
export async function muxStreams(video: Buffer | string, audio: Buffer | string, outputPath: string) {
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

        const result = await muxStreams(videoPath, audioPath, outputPath)

        // fs.unlinkSync(videoPath)
        // fs.unlinkSync(audioPath)

        fs.rmSync(tempDir, { recursive: true, force: true })

        return result
    } else if (video instanceof Buffer || audio instanceof Buffer) {
        throw Error("Video or Audio data type is not correct")
    }
    const videoPath = video as string
    const audioPath = audio as string
    return new Promise((resolve, reject) => {
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
            .on("end", resolve)
            .on("error", reject)
    })
}

