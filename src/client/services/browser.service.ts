import axios from "axios";
import { BrowserStartRequest, BrowserStopResponse, BrowserStartResponse, BrowserApiRequest, BrowserApiResponse } from "src/server/routers/browser/types"
import { BrowserStatus } from "src/server/utils/CustomPlaywright";
import { NetworkItemType } from "src/shared/types";

class BrowserService {
    status(callback: (status: BrowserStatus)=>void) {
        const ws = new WebSocket(`/ws/socket/browser/status`)

        ws.onmessage = (e) => {
            callback(e.data as BrowserStatus)
        }

        ws.onclose = () => {
            console.log("browser status websocket closed")
        }

        return () => {
            ws.close()
        }
    }

    async start(obj: BrowserStartRequest = {}) {
        const url = obj.url
        const res = await axios.post<BrowserStartResponse>(`/api/browser/start`, {}, {params: {url}})
        return res.data
    }

    async stop() {
        const res = await axios.post<BrowserStopResponse>("/api/browser/stop")
        return res.data
    }

    async apiRequest(data: BrowserApiRequest) {
        console.log("api request: ", data)
        const res = await axios.post<BrowserApiResponse>("/api/browser/api-request", data)

        return res.data
    }
}

const browserService = new BrowserService()

export default browserService