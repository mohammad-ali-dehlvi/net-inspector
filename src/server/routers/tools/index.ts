import express from "express";
import { CombineBufferRequest, CombineBufferResponse } from "src/server/routers/tools/types";
import * as fs from "node:fs";
import * as path from "node:path";

const router = express.Router();

router.post<{}, CombineBufferResponse, CombineBufferRequest>("/combine-buffer", (req, res) => {
    try {
        const buffers = req.body.dataPaths.map(e => {
            const originalPath = e.path.replaceAll(/\//, "\\")
            const fullPath = path.join(process.cwd(), originalPath)
            if (fs.existsSync(fullPath)) {
                return fs.readFileSync(fullPath)
            }
            return null
        }).filter(e => !!e) as Buffer[]
        const combinedBuffer = Buffer.concat(buffers)
        res.status(200).json({ success: true, data: combinedBuffer.toString("base64") })

    } catch (err) {
        res.status(500).json({ success: false, message: err instanceof Error ? err.message : "Something went wrong" })
    }
})

export default router