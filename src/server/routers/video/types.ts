import { NetworkItemType } from "src/shared/types"

export type VideoListResponse = {
    success: true
    data: {
        names: {name: string}[]
    }
} | {
    success: false
    message: string
}

export type VideoNameUrlParams = {
    folder_name: string
}

export type VideoNameData = {
    video?: {
        url: string
    },
    network: {pageUrl: string; requests: NetworkItemType[]}
}

export type VideoNameResponse = {
    success: true
    data: VideoNameData
} | {
    success: false
    message: string
}