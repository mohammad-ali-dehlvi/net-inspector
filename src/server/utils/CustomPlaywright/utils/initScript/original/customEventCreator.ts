import { HighlightProgress } from "src/server/utils/CustomPlaywright/types"


export function customEventCreator<T>(type: string) {
    const dispatchEvent = (data: T) => {
        const event = new CustomEvent<T>(type, { detail: data })
        window.dispatchEvent(event)
    }
    const listenEvent = (callback: (data: T) => void) => {
        window.addEventListener(type, (e: Event) => {
            const event = e as CustomEvent<T>
            callback(event.detail)
        })
    }

    return { dispatchEvent, listenEvent }
}

const {
    dispatchEvent: downloadProgressDispatchEvent,
    listenEvent: downloadProgressListenEvent
} = customEventCreator<HighlightProgress>("normal-link-progress")

export {
    downloadProgressDispatchEvent,
    downloadProgressListenEvent
}