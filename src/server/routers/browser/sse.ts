import ServerSentEvent from "src/server/utils/server_sent_event"
import { BrowserSocketStatusType } from "./types"
import { CustomPlaywrightPage } from "src/server/utils/CustomPlaywright"



export const browserSSE = new ServerSentEvent<BrowserSocketStatusType>()
// browserSSE.initialize(router)

browserSSE.onOpen(() => {
    browserSSE.sendEvent({ type: "status", data: CustomPlaywrightPage.getInstange().getStatus() })
})

CustomPlaywrightPage.getInstange().onBrowserStatusChange(({ status }) => {
    browserSSE.sendEvent({ type: "status", data: status })
})

CustomPlaywrightPage.getInstange().onResponseProgress((progress) => {
    browserSSE.sendEvent({ type: "pending_promise", data: progress })
})