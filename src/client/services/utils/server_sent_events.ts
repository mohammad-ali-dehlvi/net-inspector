
type SSECallback<T = any> = (data: T) => void;

export class SSE<T> {
    private eventSource: EventSource | null = null;
    private listeners: Set<SSECallback<T>> = new Set();

    // ==============================
    // SSE METHODS
    // ==============================

    connectSSE(url: string) {
        if (this.eventSource) return;

        this.eventSource = new EventSource(url);

        this.eventSource.onmessage = (event) => {
            this.notifyListeners(JSON.parse(event.data));
        };

        this.eventSource.onerror = (err) => {
            console.error("SSE error:", err);
        };
    }

    disconnectSSE() {
        if (this.eventSource) {
            try {
                this.eventSource.close();
            } catch (err) {
                console.log("Error in closing eventSource: ", err)
            }
            this.eventSource = null;
        }
    }

    subscribe(callback: SSECallback<T>) {
        if (!this.listeners.has(callback)) {
            this.listeners.add(callback);
        }
    }

    unsubscribe(callback: SSECallback<T>) {
        this.listeners.delete(callback);
    }

    private notifyListeners(data: any) {
        const callbacks = this.listeners;
        if (!callbacks) return;

        callbacks.forEach((cb) => typeof cb === "function" ? cb(data) : null);
    }
}