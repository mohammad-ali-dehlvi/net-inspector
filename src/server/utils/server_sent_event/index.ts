import express from "express";

class ServerSentEvent<T> {
    clients: express.Response[] = []
    onOpenCallback: (() => void) | null = null
    onCloseCallback: (() => void) | null = null

    initialize(router: express.Router, endpoint: string = "/events") {
        router.get(endpoint, (req, res) => {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.setHeader("Access-Control-Allow-Origin", "*");

            this.clients.push(res);

            this.onOpenCallback?.();

            req.on("close", () => {
                this.clients = this.clients.filter(client => client !== res);
                this.onCloseCallback?.();
            });
        })
    }

    onOpen(callback: () => void) {
        // This can be used to trigger an event when a new client connects
        // For example, you could send a welcome message or log the connection
        this.onOpenCallback = callback
    }

    onClose(callback: () => void) {
        // This can be used to trigger an event when a client disconnects
        // For example, you could log the disconnection or clean up resources
        this.onCloseCallback = callback
    }

    sendEvent(data: T) {
        const eventData = `data: ${JSON.stringify(data)}\n\n`;
        this.clients.forEach(client => client.write(eventData));
    }
}

export default ServerSentEvent