// import { downloadProgressListenEvent } from "./customEventCreator"
// import { CustomElement } from "./frontend"

// export class FreezePage {
//     static pageFrozen = false
//     static freezeStyleEl: CustomElement<HTMLStyleElement> | null = null
//     static freezeOverlay: CustomElement<HTMLDivElement> | null = null
//     static unfreezeFn: (() => void) | null = null

//     static freeze() {
//         if (this.pageFrozen) return
//         this.pageFrozen = true

//         downloadProgressListenEvent((data) => {
//             /**
//              * type of data
//              * {
//              *     [index: number | string]: {
//              *         loaded: number
//              *         percentCompleted: number | null
//              *         total: number | null
//              *     }
//              * }
//              */
//             console.log("PROGRESS: ", JSON.stringify(data, null, 4))
//         })

//         const docElement = new CustomElement(document.documentElement)
//         docElement.getClassList().add("page-frozen")

//         this.freezeStyleEl = new CustomElement(document.createElement("style"))
//         this.freezeStyleEl
//             .setId("__page-freeze-style")
//             .setInnerText(`
//             html.page-frozen * {
//                     transition: none !important;
//                     animation-play-state: paused !important;
//                 }
//             `)
//         this.freezeStyleEl.addTo(document.head)

//         this.freezeOverlay = new CustomElement(document.createElement("div"))
//         this.freezeOverlay
//             .setId("__page-freeze-overlay")
//             .setStyles({
//                 position: "fixed",
//                 inset: "0",
//                 zIndex: "2147483646",
//                 cursor: "wait",
//                 pointerEvents: "all",
//                 userSelect: "none",
//                 // background: "transparent",
//                 background: "rgba(255,255,255,0.8)"
//             })
//             .addTo(document.body)

//         const keyCapture = (ev: KeyboardEvent) => {
//             if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === "s") return
//             ev.stopImmediatePropagation()
//         }
//         document.addEventListener("keydown", keyCapture, true)
//         document.addEventListener("keyup", keyCapture, true)
//         document.addEventListener("keypress", keyCapture, true)

//         this.unfreezeFn = () => {
//             if (!this.pageFrozen) return
//             this.pageFrozen = false
//             document.documentElement.classList.remove("page-frozen")
//             this.freezeStyleEl?.remove(); this.freezeStyleEl = null
//             this.freezeOverlay?.remove(); this.freezeOverlay = null
//             document.removeEventListener("keydown", keyCapture, true)
//             document.removeEventListener("keyup", keyCapture, true)
//             document.removeEventListener("keypress", keyCapture, true)
//             this.unfreezeFn = null
//         }
//     }
// }


import { downloadProgressListenEvent } from "./customEventCreator"
import { CustomElement } from "./frontend"

type CornerPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left"

const CORNER_STYLES: Record<CornerPosition, Partial<CSSStyleDeclaration>> = {
    "bottom-right": { bottom: "20px", right: "20px", top: "auto", left: "auto" },
    "bottom-left": { bottom: "20px", left: "20px", top: "auto", right: "auto" },
    "top-right": { top: "20px", right: "20px", bottom: "auto", left: "auto" },
    "top-left": { top: "20px", left: "20px", bottom: "auto", right: "auto" },
}

const CORNER_MOVE_TARGETS: Record<CornerPosition, CornerPosition[]> = {
    "bottom-right": ["bottom-left", "top-right", "top-left"],
    "bottom-left": ["bottom-right", "top-left", "top-right"],
    "top-right": ["top-left", "bottom-right", "bottom-left"],
    "top-left": ["top-right", "bottom-left", "bottom-right"],
}

const CORNER_ARROW: Record<CornerPosition, string> = {
    "bottom-right": "↙",
    "bottom-left": "↘",
    "top-right": "↖",
    "top-left": "↗",
}

export class FreezePage {
    static pageFrozen = false
    static minimized = false
    static freezeStyleEl: CustomElement<HTMLStyleElement> | null = null
    static freezeOverlay: CustomElement<HTMLDivElement> | null = null
    static miniWidget: CustomElement<HTMLDivElement> | null = null
    static unfreezeFn: (() => void) | null = null
    static currentCorner: CornerPosition = "bottom-right"

    // ─── progress state ────────────────────────────────────────────────────────
    private static progressData: Record<string | number, {
        loaded: number
        percentCompleted: number | null
        total: number | null
    }> = {}

    // ─── DOM refs inside the overlay ───────────────────────────────────────────
    private static progressContainer: HTMLDivElement | null = null
    private static miniProgressEl: HTMLSpanElement | null = null

    // ─── public API ────────────────────────────────────────────────────────────
    static freeze() {
        if (this.pageFrozen) return
        this.pageFrozen = true
        this.minimized = false

        // inject freeze class + style
        const docElement = new CustomElement(document.documentElement)
        docElement.getClassList().add("page-frozen")

        this.freezeStyleEl = new CustomElement(document.createElement("style"))
        this.freezeStyleEl
            .setId("__page-freeze-style")
            .setInnerText(`
                html.page-frozen * {
                    transition: none !important;
                    animation-play-state: paused !important;
                }
            `)
        this.freezeStyleEl.addTo(document.head)

        // ── overlay ────────────────────────────────────────────────────────────
        const overlayEl = document.createElement("div")
        this.freezeOverlay = new CustomElement(overlayEl)
        this.freezeOverlay
            .setId("__page-freeze-overlay")
            .setStyles({
                position: "fixed",
                inset: "0",
                zIndex: "2147483646",
                cursor: "wait",
                pointerEvents: "all",
                userSelect: "none",
                background: "rgba(255,255,255,0.85)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
            } as any)
            .addTo(document.body)

        // ── modal card ─────────────────────────────────────────────────────────
        const card = document.createElement("div")
        Object.assign(card.style, {
            background: "#fff",
            borderRadius: "16px",
            padding: "32px 40px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)",
            minWidth: "320px",
            maxWidth: "480px",
            width: "90%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "20px",
            position: "relative",
        })
        overlayEl.appendChild(card)

        // spinner
        const spinner = document.createElement("div")
        spinner.id = "__freeze-spinner"
        Object.assign(spinner.style, {
            width: "44px",
            height: "44px",
            border: "4px solid #e5e7eb",
            borderTop: "4px solid #3b82f6",
            borderRadius: "50%",
            animation: "none",
        })
        card.appendChild(spinner)

        // inject spinner keyframes separately (won't be paused by page-frozen rule
        // because the spinner lives in our overlay which we control)
        const spinnerStyle = document.createElement("style")
        spinnerStyle.id = "__freeze-spinner-style"
        spinnerStyle.textContent = `
            @keyframes __freeze-spin { to { transform: rotate(360deg); } }
            #__freeze-spinner { animation: __freeze-spin 0.8s linear infinite !important; }
        `
        document.head.appendChild(spinnerStyle)

        // title
        const title = document.createElement("p")
        Object.assign(title.style, {
            margin: "0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#111827",
            letterSpacing: "-0.2px",
        })
        title.textContent = "Processing…"
        card.appendChild(title)

        // progress area
        const progressContainer = document.createElement("div")
        this.progressContainer = progressContainer
        Object.assign(progressContainer.style, {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
        })
        card.appendChild(progressContainer)

        // minimize button
        const minimizeBtn = document.createElement("button")
        Object.assign(minimizeBtn.style, {
            marginTop: "4px",
            padding: "7px 20px",
            background: "transparent",
            border: "1.5px solid #d1d5db",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#6b7280",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.15s ease",
        })
        minimizeBtn.innerHTML = `<span>⎯</span> Minimize`
        minimizeBtn.onmouseenter = () => {
            minimizeBtn.style.background = "#f9fafb"
            minimizeBtn.style.color = "#374151"
            minimizeBtn.style.borderColor = "#9ca3af"
        }
        minimizeBtn.onmouseleave = () => {
            minimizeBtn.style.background = "transparent"
            minimizeBtn.style.color = "#6b7280"
            minimizeBtn.style.borderColor = "#d1d5db"
        }
        minimizeBtn.addEventListener("click", () => this._minimize())
        card.appendChild(minimizeBtn)

        // ── mini widget (hidden until minimized) ───────────────────────────────
        this._buildMiniWidget()

        // ── keyboard capture ───────────────────────────────────────────────────
        const keyCapture = (ev: KeyboardEvent) => {
            if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === "s") return
            ev.stopImmediatePropagation()
        }
        document.addEventListener("keydown", keyCapture, true)
        document.addEventListener("keyup", keyCapture, true)
        document.addEventListener("keypress", keyCapture, true)

        // ── progress listener ──────────────────────────────────────────────────
        downloadProgressListenEvent((data) => {
            this.progressData = data as any
            this._renderProgress()
        })

        // ── unfreeze fn ────────────────────────────────────────────────────────
        this.unfreezeFn = () => {
            if (!this.pageFrozen && !this.minimized) return
            this.pageFrozen = false
            this.minimized = false
            document.documentElement.classList.remove("page-frozen")
            this.freezeStyleEl?.remove(); this.freezeStyleEl = null
            this.freezeOverlay?.remove(); this.freezeOverlay = null
            this.miniWidget?.remove(); this.miniWidget = null
            document.getElementById("__freeze-spinner-style")?.remove()
            this.progressContainer = null
            this.miniProgressEl = null
            this.progressData = {}
            document.removeEventListener("keydown", keyCapture, true)
            document.removeEventListener("keyup", keyCapture, true)
            document.removeEventListener("keypress", keyCapture, true)
            this.unfreezeFn = null
        }
    }

    // ─── private helpers ───────────────────────────────────────────────────────

    private static _buildMiniWidget() {
        const widgetEl = document.createElement("div")
        this.miniWidget = new CustomElement(widgetEl)
        this.miniWidget
            .setId("__page-freeze-mini")
            .setStyles({
                position: "fixed",
                zIndex: "2147483647",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15), 0 1px 4px rgba(0,0,0,0.08)",
                padding: "10px 14px",
                display: "none",          // hidden until minimized
                alignItems: "center",
                gap: "8px",
                fontFamily: "'Segoe UI', system-ui, sans-serif",
                fontSize: "13px",
                color: "#374151",
                cursor: "default",
                userSelect: "none",
                border: "1.5px solid #e5e7eb",
                minWidth: "160px",
                // position corners
                ...CORNER_STYLES[this.currentCorner],
            } as any)
            .addTo(document.body)

        // mini spinner
        const miniSpinner = document.createElement("div")
        miniSpinner.id = "__freeze-mini-spinner"
        Object.assign(miniSpinner.style, {
            width: "14px",
            height: "14px",
            border: "2px solid #e5e7eb",
            borderTop: "2px solid #3b82f6",
            borderRadius: "50%",
            flexShrink: "0",
        })
        widgetEl.appendChild(miniSpinner)

        const miniSpinnerStyle = document.createElement("style")
        miniSpinnerStyle.id = "__freeze-mini-spinner-style"
        miniSpinnerStyle.textContent = `
            @keyframes __freeze-mini-spin { to { transform: rotate(360deg); } }
            #__freeze-mini-spinner { animation: __freeze-mini-spin 0.8s linear infinite !important; }
        `
        document.head.appendChild(miniSpinnerStyle)

        // progress text
        const miniProgress = document.createElement("span")
        this.miniProgressEl = miniProgress
        miniProgress.textContent = "Processing…"
        Object.assign(miniProgress.style, { flex: "1", whiteSpace: "nowrap" })
        widgetEl.appendChild(miniProgress)

        // expand button
        const expandBtn = this._iconButton("⤢", "Expand", () => this._expand())
        widgetEl.appendChild(expandBtn)

        // move buttons
        this._buildMoveButtons(widgetEl)
    }

    private static _buildMoveButtons(container: HTMLDivElement) {
        const group = document.createElement("div")
        Object.assign(group.style, {
            display: "flex",
            gap: "2px",
        })

        const targets = CORNER_MOVE_TARGETS[this.currentCorner]
        targets.forEach((target) => {
            const btn = this._iconButton(CORNER_ARROW[target], target, () => this._moveWidget(target))
            group.appendChild(btn)
        })

        group.id = "__freeze-move-group"
        container.appendChild(group)
    }

    private static _iconButton(icon: string, title: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement("button")
        btn.title = title
        btn.textContent = icon
        Object.assign(btn.style, {
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "2px 5px",
            borderRadius: "6px",
            fontSize: "13px",
            color: "#9ca3af",
            lineHeight: "1",
        })
        btn.onmouseenter = () => { btn.style.background = "#f3f4f6"; btn.style.color = "#374151" }
        btn.onmouseleave = () => { btn.style.background = "transparent"; btn.style.color = "#9ca3af" }
        btn.addEventListener("click", onClick)
        return btn
    }

    private static _minimize() {
        this.minimized = true

        // unfreeze the page visually (remove class + overlay) but keep widget alive
        document.documentElement.classList.remove("page-frozen")
        if (this.freezeOverlay) {
            (this.freezeOverlay as any).el
                ? (this.freezeOverlay as any).el.style.display = "none"
                : null
            // CustomElement wraps; hide the raw DOM node
            const rawOverlay = document.getElementById("__page-freeze-overlay")
            if (rawOverlay) rawOverlay.style.display = "none"
        }

        // show mini widget
        const rawMini = document.getElementById("__page-freeze-mini")
        if (rawMini) {
            Object.assign(rawMini.style, { display: "flex" })
        }

        this._syncMiniProgress()
    }

    private static _expand() {
        this.minimized = false

        // re-freeze
        document.documentElement.classList.add("page-frozen")
        const rawOverlay = document.getElementById("__page-freeze-overlay")
        if (rawOverlay) rawOverlay.style.display = "flex"

        // hide mini widget
        const rawMini = document.getElementById("__page-freeze-mini")
        if (rawMini) rawMini.style.display = "none"
    }

    private static _moveWidget(corner: CornerPosition) {
        this.currentCorner = corner
        const rawMini = document.getElementById("__page-freeze-mini")
        if (!rawMini) return

        // reset all position props first
        Object.assign(rawMini.style, {
            top: "auto", bottom: "auto", left: "auto", right: "auto",
            ...CORNER_STYLES[corner],
        })

        // rebuild move buttons with updated targets
        const oldGroup = document.getElementById("__freeze-move-group")
        if (oldGroup) oldGroup.remove()
        this._buildMoveButtons(rawMini as HTMLDivElement)
    }

    private static _renderProgress() {
        if (!this.progressContainer) return

        // clear existing bars
        this.progressContainer.innerHTML = ""

        const keys = Object.keys(this.progressData)
        if (keys.length === 0) {
            const empty = document.createElement("p")
            Object.assign(empty.style, { margin: "0", fontSize: "13px", color: "#9ca3af" })
            empty.textContent = "Waiting for progress…"
            this.progressContainer.appendChild(empty)
            return
        }

        keys.forEach((key) => {
            const item = this.progressData[key]
            const percent = item.percentCompleted ?? (
                item.total && item.total > 0
                    ? Math.round((item.loaded / item.total) * 100)
                    : null
            )

            const row = document.createElement("div")
            Object.assign(row.style, { width: "100%", display: "flex", flexDirection: "column", gap: "4px" })

            // label row
            const labelRow = document.createElement("div")
            Object.assign(labelRow.style, {
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#6b7280",
            })
            const labelLeft = document.createElement("span")
            labelLeft.textContent = `File ${key}`
            const labelRight = document.createElement("span")
            labelRight.textContent = percent !== null
                ? `${percent}%`
                : `${this._formatBytes(item.loaded)} / ${item.total ? this._formatBytes(item.total) : "?"}`
            labelRow.appendChild(labelLeft)
            labelRow.appendChild(labelRight)
            row.appendChild(labelRow)

            // track
            const track = document.createElement("div")
            Object.assign(track.style, {
                width: "100%",
                height: "6px",
                background: "#f3f4f6",
                borderRadius: "99px",
                overflow: "hidden",
            })

            // bar
            const bar = document.createElement("div")
            Object.assign(bar.style, {
                height: "100%",
                background: percent !== null
                    ? `linear-gradient(90deg, #3b82f6 ${percent}%, #93c5fd ${percent}%)`
                    : "#3b82f6",
                borderRadius: "99px",
                width: percent !== null ? `${percent}%` : "30%",
                transition: percent !== null ? "width 0.3s ease" : "none",
                ...(percent === null
                    ? { animation: "__freeze-indeterminate 1.4s ease-in-out infinite !important" }
                    : {}),
            })
            track.appendChild(bar)
            row.appendChild(track)

            // indeterminate style (once)
            if (!document.getElementById("__freeze-indet-style")) {
                const s = document.createElement("style")
                s.id = "__freeze-indet-style"
                s.textContent = `
                    @keyframes __freeze-indeterminate {
                        0%   { width: 0%;   margin-left: 0% }
                        50%  { width: 40%;  margin-left: 30% }
                        100% { width: 0%;   margin-left: 100% }
                    }
                `
                document.head.appendChild(s)
            }

            this.progressContainer!.appendChild(row)
        })

        this._syncMiniProgress()
    }

    private static _syncMiniProgress() {
        if (!this.miniProgressEl) return
        const keys = Object.keys(this.progressData)
        if (keys.length === 0) {
            this.miniProgressEl.textContent = "Processing…"
            return
        }
        // compute overall average
        let sum = 0, count = 0
        keys.forEach((k) => {
            const item = this.progressData[k]
            const pct = item.percentCompleted ?? (
                item.total && item.total > 0 ? (item.loaded / item.total) * 100 : null
            )
            if (pct !== null) { sum += pct; count++ }
        })
        if (count > 0) {
            this.miniProgressEl.textContent = `${Math.round(sum / count)}% — ${count} file${count > 1 ? "s" : ""}`
        } else {
            this.miniProgressEl.textContent = `${keys.length} file${keys.length > 1 ? "s" : ""} downloading…`
        }
    }

    private static _formatBytes(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
        return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }
}