import axios from "axios";
import { CombineBufferRequest, CombineBufferResponse } from "src/server/routers/tools/types";


class ToolsService {

    async combineBuffers(data: CombineBufferRequest) {
        const res = await axios.post<CombineBufferResponse>("/api/tools/combine-buffer", data)
        return res.data
    }
}

const toolsService = new ToolsService()

export default toolsService