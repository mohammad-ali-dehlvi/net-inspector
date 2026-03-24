import axios from "axios";
import { AllDownloadsFileDeleteResponse, AllDownloadsResponse, VideoListResponse, VideoNameResponse } from "src/server/routers/video/types"

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

    async getAllDownloads() {
        const res = await axios.get<AllDownloadsResponse>("/api/video/all-downloads")
        if (res.data.success) {
            return {
                ...res.data,
                data: {
                    urls: res.data.data.urls.map(urlObj => ({
                        ...urlObj,
                        url: "url" in urlObj ?
                            `/api${urlObj.url}` :
                            undefined,
                        urls: "urls" in urlObj ?
                            urlObj.urls.map((e) => ({
                                url: `/api${e.url}`
                            })) :
                            undefined
                    }))
                }
            }
        }
        return res.data
    }

    async deleteAllDownloadFile(fileName: string) {
        const res = await axios.delete<AllDownloadsFileDeleteResponse>(`/api/video/all-downloads/${fileName}`)
        return res.data
    }
}

const videoService = new VideoService()

export default videoService