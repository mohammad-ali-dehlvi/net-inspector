import { CustomElement } from "./frontend"

export class FreezePage {
    static pageFrozen = false
    static freezeStyleEl: CustomElement<HTMLStyleElement> | null = null
    static freezeOverlay: CustomElement<HTMLDivElement> | null = null
    static unfreezeFn: (() => void) | null = null

    static freeze() {
        if (this.pageFrozen) return
        this.pageFrozen = true

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

        this.freezeOverlay = new CustomElement(document.createElement("div"))
        this.freezeOverlay
            .setId("__page-freeze-overlay")
            .setStyles({
                position: "fixed",
                inset: "0",
                zIndex: "2147483646",
                cursor: "wait",
                pointerEvents: "all",
                userSelect: "none",
                // background: "transparent",
                background: "rgba(255,255,255,0.8)"
            })
            .addTo(document.body)

        const keyCapture = (ev: KeyboardEvent) => {
            if (ev.ctrlKey && ev.shiftKey && ev.key.toLowerCase() === "s") return
            ev.stopImmediatePropagation()
        }
        document.addEventListener("keydown", keyCapture, true)
        document.addEventListener("keyup", keyCapture, true)
        document.addEventListener("keypress", keyCapture, true)

        this.unfreezeFn = () => {
            if (!this.pageFrozen) return
            this.pageFrozen = false
            document.documentElement.classList.remove("page-frozen")
            this.freezeStyleEl?.remove(); this.freezeStyleEl = null
            this.freezeOverlay?.remove(); this.freezeOverlay = null
            document.removeEventListener("keydown", keyCapture, true)
            document.removeEventListener("keyup", keyCapture, true)
            document.removeEventListener("keypress", keyCapture, true)
            this.unfreezeFn = null
        }
    }
}