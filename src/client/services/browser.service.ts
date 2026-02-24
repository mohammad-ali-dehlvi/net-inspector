import axios from "axios";
import { BrowserStartRequest, BrowserStopResponse, BrowserStartResponse, BrowserApiRequest, BrowserApiResponse, BrowserSocketStatusType } from "src/server/routers/browser/types"
import { BrowserStatus } from "src/server/utils/CustomPlaywright";
import { SSE } from "src/client/services/utils/server_sent_events";

class BrowserService extends SSE<BrowserSocketStatusType> {
    connectSSE(): void {
        super.connectSSE(`/api/browser/events`)
    }

    async start(obj: BrowserStartRequest = {}) {
        const url = obj.url
        const res = await axios.post<BrowserStartResponse>(`/api/browser/start`, {}, { params: { url } })
        return res.data
    }

    async stop() {
        const res = await axios.post<BrowserStopResponse>("/api/browser/stop")
        return res.data
    }

    async apiRequest(data: BrowserApiRequest) {
        // delete data['html']
        const res = await axios.post<BrowserApiResponse>("/api/browser/api-request", data)

        return res
    }
}

const browserService = new BrowserService()

export default browserService