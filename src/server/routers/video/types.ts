import { ResultType } from "src/server/utils/CustomPlaywright"
import { DownloadFileResponseType, NetworkItemType } from "src/shared/types"

export type VideoListResponse = {
    success: true
    data: {
        names: { name: string }[]
    }
} | {
    success: false
    message: string
}

export type VideoNameUrlParams = {
    folder_name: string
}

export type VideoNameData = ResultType

export type VideoNameResponse = {
    success: true
    data: VideoNameData
} | {
    success: false
    message: string
}

export type AllDownloadsResponse = {
    success: true
    data: {
        urls: DownloadFileResponseType[]
    }
} | {
    success: false
    message: string
}

export type AllDownloadsFileDeleteRequest = {
    file_name: string
}

export type AllDownloadsFileDeleteResponse = {
    success: true
} | {
    success: false
    message: string
}