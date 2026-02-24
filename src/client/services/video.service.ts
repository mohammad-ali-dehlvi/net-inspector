import axios from "axios";
import { VideoListResponse, VideoNameResponse } from "src/server/routers/video/types"

class VideoService {
    async getNameList() {
        const res = await axios.get<VideoListResponse>("/api/video/list")
        return res.data
    }

    async getNameDetails(folderName: string) {
        const res = await axios.get<VideoNameResponse>(`/api/video/details/${folderName}`)
        if (res.data.success) {
            res.data = {
                ...res.data,
                data: {
                    ...res.data.data,
                    result: res.data.data.result.map((e) => {
                        return {
                            ...e,
                            file: `/api${e.file}`,
                            result: {
                                ...e.result,
                                network: e.result.network.map((f) => {
                                    return {
                                        ...f,
                                        response: {
                                            ...f.response,
                                            body: f.response.body && "url" in f.response.body ?
                                                {
                                                    url: `/api${f.response.body.url}`,
                                                    contentType: f.response.body.contentType
                                                } :
                                                f.response.body
                                        }
                                    }
                                })
                            }
                        }
                    })
                }
            }
        }
        return res.data
    }
}

const videoService = new VideoService()

export default videoService