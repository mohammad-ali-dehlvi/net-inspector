
type SSECallback<T = any> = (data: T) => void;

export class SSE<T> {
    private eventSource: EventSource | null = null;
    private listeners: Set<SSECallback<T>> = new Set();
    private url: string | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private retryDelay: number = 2000; // Starting delay: 2 seconds

    private lastHeartbeat: number = Date.now();
    private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

    // ==============================
    // SSE METHODS
    // ==============================

    connectSSE(url: string) {
        this.url = url;
        if (this.eventSource) return;

        console.log(`Attempting to connect to SSE: ${url}`);
        this.eventSource = new EventSource(url);

        this.heartbeatFunc()

        this.eventSource.onopen = () => {
            console.log("SSE connection established.");
            this.retryDelay = 2000; // Reset delay on successful connection
        };

        this.eventSource.onmessage = (event) => {
            try {
                this.notifyListeners(JSON.parse(event.data));
            } catch (err) {
                console.error("Error parsing SSE data:", err);
            }
        };

        this.eventSource.onerror = (err) => {
            console.error("SSE error occurred. Attempting to reconnect...", err);
            this.handleReconnect();
        };
    }

    private handleReconnect() {
        this.disconnectSSE(false);

        // Increase the initial delay to 3-5 seconds specifically for dev restarts
        const backoff = Math.min(this.retryDelay, 30000);

        if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

        this.reconnectTimeout = setTimeout(() => {
            if (this.url) {
                console.log("🔄 Backend likely restarting... retrying connection.");
                this.connectSSE(this.url);
                // Gradually increase delay: 2s -> 4s -> 8s...
                this.retryDelay *= 2;
            }
        }, backoff);
    }

    disconnectSSE(clearUrl: boolean = true) {
        this.clearHeartbeat()
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.eventSource) {
            try {
                this.eventSource.close();
                this.eventSource = null;
            } catch (err) {
                console.log("Error in closing eventSource: ", err);
            }
        }

        if (clearUrl) this.url = null;
    }

    subscribe(callback: SSECallback<T>) {
        if (!this.listeners.has(callback)) {
            this.listeners.add(callback);
        }
    }

    unsubscribe(callback: SSECallback<T>) {
        this.listeners.delete(callback);
    }

    private clearHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    private async heartbeatFunc() {
        const getHeartbeatTimeout = async () => {
            const promise = new Promise<{ timeout: number }>((resolve, reject) => {
                if (!this.eventSource) {
                    resolve({ timeout: 5000 })
                    return
                }
                this.eventSource.addEventListener("heartbeat_timeout", (e) => {
                    const data = JSON.parse(e.data) as { timeout: number }

                    resolve(data)
                })
            })
            return await promise
        }
        if (!this.eventSource) return

        const { timeout } = await getHeartbeatTimeout()

        this.eventSource.addEventListener("heartbeat", () => {
            this.lastHeartbeat = Date.now();
            this.clearHeartbeat()
            this.heartbeatInterval = setInterval(() => {
                if (Date.now() - this.lastHeartbeat > timeout) {
                    console.log("💀 Heartbeat missed. Backend likely restarted.");
                    this.handleReconnect();
                }
            }, timeout + 1000)
        });

    }

    private notifyListeners(data: any) {
        const callbacks = this.listeners;
        if (!callbacks) return;

        callbacks.forEach((cb) => typeof cb === "function" ? cb(data) : null);
    }
}