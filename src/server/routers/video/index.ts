import express from "express";
import * as path from "node:path";
import * as fs from "node:fs";
import { AllDownloadsFileDeleteRequest, AllDownloadsFileDeleteResponse, AllDownloadsResponse, VideoListResponse, VideoNameData, VideoNameResponse, VideoNameUrlParams } from "src/server/routers/video/types";
import { CustomPlaywrightPage, ResultType } from "src/server/utils/CustomPlaywright";
import { NetworkItemType } from "src/shared/types";
import { RandomFileName } from "src/server/utils/functions";
import { parseDownloadFileUrl } from "./utils/functions";

const router = express.Router()

router.get<{}, VideoListResponse>("/list", (req, res) => {
    try {
        const data = (() => {
            const p = path.join(process.cwd(), "data", "video")
            const isExist = fs.existsSync(p)
            if (isExist) {
                const dirData = fs.readdirSync(p)
                return dirData
            }
            return []
        })()

        res.status(200).json({ success: true, data: { names: data.map(n => ({ name: n })) } })
    } catch (err) {
        res.status(500).json({ success: false, message: (err as Error).message })
    }
})

router.get<VideoNameUrlParams, VideoNameResponse>("/details/:folder_name", (req, res) => {
    try {
        const folderName = req.params.folder_name
        const staticBaseURL = `/data/video/${folderName}`
        // const host = req.get("host")
        const p = path.join(process.cwd(), "data", "video", folderName)
        const isExist = fs.existsSync(p)
        const list = isExist ? fs.readdirSync(p) : []

        // Network.json file
        const networkFile = list.find(name => name === CustomPlaywrightPage.network_file_name)
        const networkStr = networkFile ? fs.readFileSync(path.join(p, networkFile), { encoding: "utf-8" }) : JSON.stringify([])
        const networkObj: ResultType = JSON.parse(networkStr)

        networkObj.result = networkObj.result.map((e) => {
            return {
                ...e,
                file: `${staticBaseURL}/${CustomPlaywrightPage.videos_folder_path}/${e.file}`,
                result: {
                    ...e.result,
                    network: e.result.network.toSorted((a, b) => {
                        return a.startSeconds - b.startSeconds
                    })
                }
            }
        })


        const downloadedFilesPath = path.join(p, CustomPlaywrightPage.download_files_folder_path)
        if (fs.existsSync(downloadedFilesPath)) {
            const downloadedFilesName = fs.readdirSync(downloadedFilesPath)
            networkObj.downloadFiles = downloadedFilesName.map((name) => {
                const p = path.join(downloadedFilesPath, name)
                return parseDownloadFileUrl(p)
            })
        }

        const obj = networkObj

        res.status(200).json({ success: true, data: obj })
    } catch (err) {
        res.status(500).json({ success: false, message: (err as Error).message })
    }
})

router.get<{}, AllDownloadsResponse>("/all-downloads", (req, res) => {
    try {
        if (fs.existsSync(CustomPlaywrightPage.all_downloads_folder)) {
            const names = fs.readdirSync(CustomPlaywrightPage.all_downloads_folder)
            const result: AllDownloadsResponse = {
                success: true,
                data: {
                    urls: names.map((name) => {
                        return parseDownloadFileUrl(path.join(CustomPlaywrightPage.all_downloads_folder, name))
                    })
                }
            }
            res
                .status(200)
                .send(result)
        } else {
            res
                .status(404)
                .send({
                    success: false,
                    message: 'All Downloads folder not found'
                })
        }
    } catch (err) {
        console.log("ERROR All downloads file: ", err)
        res.status(500)
            .send({
                success: false,
                message: 'Something went wrong'
            })
    }
})

router.delete<AllDownloadsFileDeleteRequest, AllDownloadsFileDeleteResponse>("/all-downloads/:file_name", (req, res) => {
    try {
        const fileName = req.params.file_name
        const filePath = path.join(CustomPlaywrightPage.all_downloads_folder, fileName)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            res.send({ success: true })
            return
        } else {
            res.send({ success: false, message: "File not found" })
        }
    } catch (err) {
        res.send({ success: false, message: (err as Error).message })
    }
})

export default router