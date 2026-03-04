import express, { Response } from "express";

class ServerSentEvent<T> {
    clients: express.Response[] = []
    heartbeatTimeout = 3000
    onOpenCallback: ((client: Response) => void) | null = null
    onCloseCallback: ((client: Response) => void) | null = null

    initialize(router: express.Router, endpoint: string = "/events") {
        router.get(endpoint, (req, res) => {
            console.log(`SSE connected for ${req.url}`)
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("Access-Control-Allow-Origin", "*");

            res.flushHeaders()

            const cleanupHeartbeat = this.heartbeatFunc(res)

            this.clients.push(res);

            this.onOpenCallback?.(res);

            req.on("close", () => {
                cleanupHeartbeat()
                console.log(`SSE closed for ${req.url}`)
                this.clients = this.clients.filter(client => client !== res);
                this.onCloseCallback?.(res);
            });
        })
    }

    onOpen(callback: (client: Response) => void) {
        // This can be used to trigger an event when a new client connects
        // For example, you could send a welcome message or log the connection
        this.onOpenCallback = callback
    }

    onClose(callback: (client: Response) => void) {
        // This can be used to trigger an event when a client disconnects
        // For example, you could log the disconnection or clean up resources
        this.onCloseCallback = callback
    }

    sendEvent(data: T, options?: { client?: Response }) {
        const { client } = options || {}
        const eventData = `data: ${JSON.stringify(data)}\n\n`;
        if (client) {
            client.write(eventData)
        } else {
            this.clients.forEach(client => client.write(eventData));
        }
    }

    private heartbeatFunc(res: express.Response) {

        res.write("event: heartbeat_timeout\n");
        res.write(`data: ${JSON.stringify({ timeout: this.heartbeatTimeout })}\n\n`)

        // 🔥 Heartbeat every 3s
        const heartbeatFunc = () => {
            res.write("event: heartbeat\n");
            res.write("data: ping\n\n");
        }
        heartbeatFunc()
        const heartbeat = setInterval(heartbeatFunc, this.heartbeatTimeout);

        return () => {
            clearInterval(heartbeat);
        }
    }
}

export default ServerSentEvent