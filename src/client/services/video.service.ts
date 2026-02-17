import axios from "axios";
import { VideoListResponse, VideoNameResponse } from "src/server/routers/video/types"

class VideoService {
    async getNameList(){
        const res = await axios.get<VideoListResponse>("/api/video/list")
        return res.data
    }

    async getNameDetails(folderName: string) {
        const res = await axios.get<VideoNameResponse>(`/api/video/details/${folderName}`)
        return res.data
    }
}

const videoService = new VideoService()

export default videoService