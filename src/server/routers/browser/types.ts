import { NetworkItemType } from "src/shared/types"

export type BrowserStatusResponse = {
    status: "started" | "stopped"
}

export type BrowserStartRequest = {
    url?: string
}

export type BrowserStartResponse = {
    success: boolean
}

export type BrowserStopResponse = {
    success: boolean
}

export type BrowserApiRequest = { request: NetworkItemType['request']; pageUrl?: string }

export type BrowserApiResponse = {
    success: true
    type: string | null
    data: any
    contentType?: string | null
} | {
    success: false
    message: string
}