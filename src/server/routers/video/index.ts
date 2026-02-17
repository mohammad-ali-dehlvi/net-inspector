import express from "express";
import * as path from "node:path";
import * as fs from "node:fs";
import { VideoListResponse, VideoNameData, VideoNameResponse, VideoNameUrlParams } from "src/server/routers/video/types";
import { CustomPlaywrightPage } from "src/server/utils/CustomPlaywright";

const router = express.Router()

router.get<{},VideoListResponse>("/list", (req, res)=>{
    try{
        const data = (()=>{
                const p = path.join(process.cwd(), "data", "video")
                const isExist = fs.existsSync(p)
                if (isExist) {
                    const dirData = fs.readdirSync(p)
                    return dirData
                }
                return []
            })()

        res.status(200).json({success: true, data: {names: data.map(n=>({name: n}))}})
    }catch(err){
        res.status(500).json({success: false, message: (err as Error).message})
    }      
})

router.get<VideoNameUrlParams,VideoNameResponse>("/details/:folder_name", (req, res)=>{
    try{
        const folderName = req.params.folder_name
        const host = req.get("host")
        const p = path.join(process.cwd(), "data", "video", folderName)
        const isExist = fs.existsSync(p)
        const list = isExist ? fs.readdirSync(p) : []
        const video = list.find(name=>name !== CustomPlaywrightPage.network_file_name)
        const networkFile = list.find(name=>name === CustomPlaywrightPage.network_file_name)
        const networkStr = networkFile ? fs.readFileSync(path.join(p, networkFile), {encoding: "utf-8"}) : JSON.stringify([])
        
        const obj: VideoNameData = {
            video: video ? {url: `/data/video/${folderName}/${video}`}: undefined,
            network: JSON.parse(networkStr)
        }

        res.status(200).json({success: true, data: obj})
    }catch(err){
        res.status(500).json({success: false, message: (err as Error).message})
    }
})

export default router