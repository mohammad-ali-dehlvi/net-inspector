import express from "express"
import { CustomPlaywrightPage } from "src/server/utils/CustomPlaywright"
import { BrowserApiRequest, BrowserApiResponse, BrowserStartRequest, BrowserStartResponse, BrowserStatusResponse, BrowserStopResponse } from "src/server/routers/browser/types"

const router = express.Router()

router.get<{},BrowserStatusResponse>("/status", (req, res)=>{
    res.status(200).json({
        status: CustomPlaywrightPage.getInstange().getStatus()
    })
})

router.post<BrowserStartRequest,BrowserStartResponse,{},BrowserStartRequest>("/start", async (req, res)=>{
    try{
        const url = req.query.url || null
        await CustomPlaywrightPage.getInstange().goto(url || "http://google.com")
        return res.status(200).json({success: true})
    }catch(err){
        return res.status(500).json({success: false})
    }
})

router.post<{},BrowserStopResponse>("/stop", async (req, res)=>{
    try{
        await CustomPlaywrightPage.getInstange().close()
        return res.status(200).json({success: true})
    }catch(err){
        return res.status(200).json({success: false})
    }
})

router.post<{},BrowserApiResponse,BrowserApiRequest>("/api-request", async (req, res) => {
    try{
        // return res.status(200).json({success: true, data: req.body})
        const data = await CustomPlaywrightPage.getInstange().request(req.body)
        return res.status(200).json({success: true, data})
    }catch(err){
        return res.status(500).json({success: false, message: err instanceof Error ? err.message : "Something went wrong"})
    }
})

export default router