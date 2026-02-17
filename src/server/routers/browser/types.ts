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

export type BrowserApiRequest = NetworkItemType

export type BrowserApiResponse = {
    success: true
    data: any
} | {
    success: false
    message: string
}