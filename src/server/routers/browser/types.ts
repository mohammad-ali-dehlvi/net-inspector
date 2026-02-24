import { BrowserStatus, ResponseProgress } from "src/server/utils/CustomPlaywright"
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
    data: string | null
    contentType?: string | null
} | {
    success: false
    message: string
}

export type BrowserSocketStatusType = {
    type: "status",
    data: BrowserStatus
} | {
    type: "pending_promise",
    data: ResponseProgress
} | {
    type: "stop_error",
    data: string
} | {
    type: "unknown",
    data: any
}