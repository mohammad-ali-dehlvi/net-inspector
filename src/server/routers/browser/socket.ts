import express from "express"
import type { Instance } from "express-ws"
import { CustomPlaywrightPage } from "src/server/utils/CustomPlaywright"

export const socketRouter = (ins: Instance) => {
    const router = express.Router()
    ins.applyTo(router)

    console.log("Initializing the browser router WS")
    router.ws("/status", (ws, req)=>{
        console.log("Client connected to '/status'")

        ws.on('message', (msg) => {
            console.log(`Received: ${msg}`);
            // Echo the message back to the client
            ws.send(`Server received: ${msg}`);
        });

        setTimeout(()=>{
            ws.send(CustomPlaywrightPage.getInstange().getStatus())
        })

        CustomPlaywrightPage.getInstange().onBrowserStatusChange(({status})=>{
            ws.send(status)
        })

        // Handle connection close
        ws.on('close', () => {
            console.log('Client disconnected');
        });
    })

    return router
}
