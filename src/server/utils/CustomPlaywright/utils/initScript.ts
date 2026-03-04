import { resolve } from "node:dns";
import type { PassLinksDataType, PassLinksMediaSourceDataType, PassLinksType, PassMediaSourceDataType, PassMediaSourceFuncType } from "src/server/utils/CustomPlaywright/types";

declare global {
    interface Window {
        passLinks: PassLinksType;
        passMediaSource: PassMediaSourceFuncType
    }
}
export function initScript() {
    // @ts-ignore
    window.__name = (fn: Function, name: string) =>
        Object.defineProperty(fn, "name", { value: name, configurable: true });

    const OriginalMediaSource = window.MediaSource;
    const originalAddSourceBuffer = MediaSource.prototype.addSourceBuffer;

    function main() {

        const mediaSourceDashboard = new MediaSourceDashboard()

        document.addEventListener("DOMContentLoaded", () => {
            mediaSourceDashboard.renderHTML(document.body)
        })

        const originalCreateObjectURL = URL.createObjectURL
        URL.createObjectURL = (obj: any) => {
            const url = originalCreateObjectURL.call(URL, obj)
            const name = obj.constructor.name
            mediaSourceDashboard.urlMap.set(url, {
                type: typeof name === "string" ? name.toLowerCase() : name,
                instance: obj
            })

            return url
        }

        // @ts-ignore
        window.MediaSource = function () {
            console.log('--- New MediaSource Instance Created ---');
            const ins = new OriginalMediaSource();

            mediaSourceDashboard.setMediaSource(ins)

            return ins
        };

        // Ensure static methods (like isTypeSupported) are still accessible
        Object.setPrototypeOf(window.MediaSource, OriginalMediaSource);
        window.MediaSource.prototype = OriginalMediaSource.prototype;

        MediaSource.prototype.addSourceBuffer = function (mimeType) {
            // Call the original method to get the real SourceBuffer instance
            const sourceBuffer = originalAddSourceBuffer.call(this, mimeType);

            // Custom injection: Attach the parent MediaSource to the instance
            // We use a non-enumerable property to avoid interfering with player logic
            Object.defineProperties(sourceBuffer, {
                '__parentMediaSource': {
                    value: this,
                    writable: false,
                    enumerable: false
                },
                'mimeType': {
                    value: mimeType,
                    writable: false,
                    enumerable: false
                }
            })

            mediaSourceDashboard.setSourceBuffer(sourceBuffer)

            console.log(`[MediaSource] Created SourceBuffer for: ${mimeType}`);
            return sourceBuffer;
        };



        const originalAppendBuffer = SourceBuffer.prototype.appendBuffer;

        SourceBuffer.prototype.appendBuffer = function (data: BufferSource) {

            const arrayBuffer = data instanceof ArrayBuffer ? data.slice(0) : data.buffer.slice(0)

            mediaSourceDashboard.setArrayBuffer(this, arrayBuffer)

            // Call the original method with the correct 'this' context
            return originalAppendBuffer.apply(this, [data]);
        };

        const mouse: { x: number | null; y: number | null } = { x: null, y: null }
        const prevMousePos: typeof mouse = { ...mouse }
        function checkPos() {
            if (FreezePage.pageFrozen || mouse.x === null || mouse.y === null || (mouse.x === prevMousePos.x && mouse.y === prevMousePos.y)) return
            prevMousePos.x = mouse.x;
            prevMousePos.y = mouse.y;
            const elements = document.elementsFromPoint(mouse.x, mouse.y)

            const insList = Highlighter.getOrCreateInstances(elements.filter(e => ["VIDEO", "IMG", "AUDIO"].includes(e.tagName) && !e.classList.contains("ignore-this")))

            insList.forEach(e => {
                e.createBorder()
            })
        }

        document.addEventListener("mousemove", (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        })

        registerShortcut(['ctrl', 'shift', 's'], (e) => {
            e.preventDefault();
            e.stopPropagation();

            FreezePage.freeze()
            mediaSourceDashboard.sendToExpress().finally(() => {
                FreezePage.unfreezeFn?.()
            })
        })

        let count = 0
        function animationLoop() {
            if (count > 10) {
                checkPos();
                count = 0
            } else {
                count++
            }
            requestAnimationFrame(animationLoop);
        }

        animationLoop();
    }

    class Highlighter {
        ele: Element
        highlighter: HTMLDivElement | null = null
        highlighterText: HTMLDivElement | null = null
        highlighterControls: HTMLDivElement | null = null
        constructor(ele: Element) {
            this.ele = ele;
            const main = this.getOrCreateHighlighter()
            const text = this.getOrCreateHighlighterText()
            // const controls = this.getOrCreateHighlighterControls()

            main.appendChild(text)
            // main.appendChild(controls)

            if (!document.body) {
                const handleContentLoaded = () => {
                    document.body.appendChild(main)
                    setTimeout(() => {
                        document.removeEventListener("DOMContentLoaded", handleContentLoaded)
                    })
                }
                document.addEventListener("DOMContentLoaded", handleContentLoaded)
            } else {
                document.body.appendChild(main)
            }
        }

        public getLink() {
            const { ele } = this
            return "src" in ele ?
                ele.src as string :
                "href" in ele ?
                    ele.href as string :
                    null
        }

        private getOrCreateHighlighter() {
            if (this.highlighter) return this.highlighter

            const highlighter = document.createElement("div");
            highlighter.id = `highlighter-${Highlighter.instances.length}`;

            highlighter.style.pointerEvents = "none";
            highlighter.style.display = "none";
            highlighter.style.position = "fixed";
            highlighter.style.top = "0px";
            highlighter.style.left = "0px";
            highlighter.style.width = "0px";
            highlighter.style.height = "0px";
            highlighter.style.border = "2px solid red";
            // highlighter.style.transition = "all 0.5s";

            this.highlighter = highlighter

            return highlighter
        }

        private getOrCreateHighlighterText() {
            if (this.highlighterText) return this.highlighterText

            const highlighterText = document.createElement("div");
            highlighterText.id = `highlighter-text-${Highlighter.instances.length}`;

            highlighterText.style.pointerEvents = "auto";
            highlighterText.style.display = "inline-block";
            highlighterText.style.position = "absolute";
            highlighterText.style.top = "0px";
            highlighterText.style.left = "50%";
            highlighterText.style.transform = "translateX(-50%)";
            highlighterText.style.background = "red";
            highlighterText.style.color = "white";
            highlighterText.style.fontWeight = "700";

            this.highlighterText = highlighterText

            return highlighterText
        }

        private getOrCreateHighlighterControls() {
            if (this.highlighterControls) return this.highlighterControls

            const highlighterControls = document.createElement("div");
            highlighterControls.id = `highlighter-controls-${Highlighter.instances.length}`;

            highlighterControls.style.pointerEvents = "auto";
            highlighterControls.style.padding = "5px 10px";
            highlighterControls.style.borderRadius = "5px";
            highlighterControls.style.background = "rgba(255,255,255,1)";
            highlighterControls.style.position = "absolute";
            highlighterControls.style.top = "50%";
            highlighterControls.style.left = "50%";
            highlighterControls.style.transform = "translate(-50%,-50%)";

            const container = document.createElement("div")
            container.id = `${highlighterControls.id}-container`
            highlighterControls.appendChild(container)

            this.highlighterControls = highlighterControls

            return highlighterControls
        }

        createBorder() {
            const { ele, highlighter, highlighterText } = this

            if (!highlighter || !highlighterText) return

            const rect = ele.getBoundingClientRect()
            highlighter.style.display = "block"
            highlighter.style.width = `${rect.width}px`
            highlighter.style.height = `${rect.height}px`
            highlighter.style.top = `${rect.top}px`
            highlighter.style.left = `${rect.left}px`
            highlighter.style.zIndex = "9999999"

            highlighterText.innerText = ele.tagName
            highlighterText.title = this.getLink() || "LINK NOT FOUND"
        }

        remove() {
            const { highlighter } = this
            if (!highlighter) return

            // highlighter.style.display = "none"
            highlighter.remove()
        }

        static instances: Highlighter[] = []
        static getOrCreateInstances(eleList: Element[]) {
            const result: typeof Highlighter.instances = []

            for (let i = 0; i < eleList.length; i++) {
                const ele = eleList[i]

                const ins = Highlighter.instances.find(e => e.ele === ele)
                if (ins) result.push(ins)
                else {
                    result.push(new Highlighter(ele))
                }
            }
            const arr = Highlighter.instances.filter(e => !result.includes(e))
            for (let i = 0; i < arr.length; i++) {
                const n = arr[i]
                n.remove()
            }
            Highlighter.instances = result

            return Highlighter.instances
        }
    }

    class Icons {
        static svgNS = "http://www.w3.org/2000/svg";
        static downloadIcon() {
            const { svgNS } = this
            // Create SVG
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("fill", "none");
            svg.setAttribute("xmlns", svgNS);

            // --- Group 1 ---
            const g1 = document.createElementNS(svgNS, "g");
            g1.setAttribute("id", "SVGRepo_bgCarrier");
            g1.setAttribute("stroke-width", "0");

            // --- Group 2 ---
            const g2 = document.createElementNS(svgNS, "g");
            g2.setAttribute("id", "SVGRepo_tracerCarrier");
            g2.setAttribute("stroke-linecap", "round");
            g2.setAttribute("stroke-linejoin", "round");

            // --- Group 3 ---
            const g3 = document.createElementNS(svgNS, "g");
            g3.setAttribute("id", "SVGRepo_iconCarrier");

            // --- Path 1 ---
            const path1 = document.createElementNS(svgNS, "path");
            path1.setAttribute(
                "d",
                "M12.5535 16.5061C12.4114 16.6615 12.2106 16.75 12 16.75C11.7894 16.75 11.5886 16.6615 11.4465 16.5061L7.44648 12.1311C7.16698 11.8254 7.18822 11.351 7.49392 11.0715C7.79963 10.792 8.27402 10.8132 8.55352 11.1189L11.25 14.0682V3C11.25 2.58579 11.5858 2.25 12 2.25C12.4142 2.25 12.75 2.58579 12.75 3V14.0682L15.4465 11.1189C15.726 10.8132 16.2004 10.792 16.5061 11.0715C16.8118 11.351 16.833 11.8254 16.5535 12.1311L12.5535 16.5061Z"
            );
            path1.setAttribute("fill", "#1C274C");

            // --- Path 2 ---
            const path2 = document.createElementNS(svgNS, "path");
            path2.setAttribute(
                "d",
                "M3.75 15C3.75 14.5858 3.41422 14.25 3 14.25C2.58579 14.25 2.25 14.5858 2.25 15V15.0549C2.24998 16.4225 2.24996 17.5248 2.36652 18.3918C2.48754 19.2919 2.74643 20.0497 3.34835 20.6516C3.95027 21.2536 4.70814 21.5125 5.60825 21.6335C6.47522 21.75 7.57754 21.75 8.94513 21.75H15.0549C16.4225 21.75 17.5248 21.75 18.3918 21.6335C19.2919 21.5125 20.0497 21.2536 20.6517 20.6516C21.2536 20.0497 21.5125 19.2919 21.6335 18.3918C21.75 17.5248 21.75 16.4225 21.75 15.0549V15C21.75 14.5858 21.4142 14.25 21 14.25C20.5858 14.25 20.25 14.5858 20.25 15C20.25 16.4354 20.2484 17.4365 20.1469 18.1919C20.0482 18.9257 19.8678 19.3142 19.591 19.591C19.3142 19.8678 18.9257 20.0482 18.1919 20.1469C17.4365 20.2484 16.4354 20.25 15 20.25H9C7.56459 20.25 6.56347 20.2484 5.80812 20.1469C5.07435 20.0482 4.68577 19.8678 4.40901 19.591C4.13225 19.3142 3.9518 18.9257 3.85315 18.1919C3.75159 17.4365 3.75 16.4354 3.75 15Z"
            );
            path2.setAttribute("fill", "#1C274C");

            // Build structure
            g3.appendChild(path1);
            g3.appendChild(path2);

            svg.appendChild(g1);
            svg.appendChild(g2);
            svg.appendChild(g3);

            // Append to DOM
            return svg
        }
    }

    class MediaSourceDashboard {
        mediaSourceMap: Map<MediaSource, PassLinksMediaSourceDataType<ArrayBuffer>> = new Map()
        urlMap: Map<string, { type: PassLinksDataType['type'] | "mediasource"; instance: MediaSource | Blob | File }> = new Map()
        elements: { [key: string]: HTMLElement } = {}
        constructor() { }

        async appendArrayBuffer(sb: SourceBuffer, arrayBuffer: BufferSource) {
            const promise = new Promise<"done">((resolve, reject) => {
                sb.addEventListener("updateend", () => {
                    resolve("done")
                }, { once: true })
                sb.appendBuffer(arrayBuffer)
            })

            return await promise
        }

        setMediaSource(ms: MediaSource) {
            const { mediaSourceMap } = this
            if (!mediaSourceMap.has(ms)) {
                mediaSourceMap.set(ms, {
                    sourceBuffers: [],
                    data: []
                })
            }
            const eventHandler = () => {
                if (!document.body) {
                    document.addEventListener("DOMContentLoaded", eventHandler, { once: true })
                    return
                }
                this.renderHTML(document.body)
            }
            ms.addEventListener("sourceopen", eventHandler)
            ms.addEventListener("sourceclose", eventHandler)
            ms.addEventListener("sourceended", eventHandler)
        }

        setSourceBuffer(sb: SourceBuffer) {
            const { mediaSourceMap } = this

            if ("__parentMediaSource" in sb) {
                const ms = sb.__parentMediaSource as MediaSource

                this.setMediaSource(ms)

                const obj = mediaSourceMap.get(ms)!
                if (!obj.sourceBuffers.includes(sb)) {
                    obj.sourceBuffers.push(sb)
                }
            }
        }

        serializeMediaSourceMap() {
            const { mediaSourceMap } = this
            const mediaSourceArr = Array.from(mediaSourceMap.keys())
            const result: { data: { mimeType: string; buffer: Uint8Array }[] }[] = []
            for (let mediaSource of mediaSourceArr) {
                const obj = mediaSourceMap.get(mediaSource)!
                result.push({
                    // ...obj,
                    data: obj.data.map(e => ({ ...e, buffer: new Uint8Array(e.data.slice(0)) }))
                })
            }
            return result
        }

        setArrayBuffer(sb: SourceBuffer, arrayBuffer: ArrayBuffer) {
            const { mediaSourceMap } = this
            const sourceBufferObj = mediaSourceMap.values().find(e => e.sourceBuffers.includes(sb))

            if (sourceBufferObj && "mimeType" in sb && typeof sb.mimeType === "string" && "__parentMediaSource" in sb) {
                sourceBufferObj.data.push({ mimeType: sb.mimeType, data: arrayBuffer })
                // serializeMediaSourceMap()
            }
        }

        async sendToExpress() {
            const { urlMap, mediaSourceMap } = this
            const data: PassLinksDataType[] = [];

            const splitHighlightedInstances = () => {
                const arr = Highlighter.instances
                const normalHighlighters: Highlighter[] = []
                const mediaSourceHighlighters: Highlighter[] = []

                for (let i = 0; i < arr.length; i++) {
                    const obj = arr[i]
                    const link = obj.getLink()
                    if (!link) continue
                    const urlObj = urlMap.get(link)
                    if (urlObj?.type !== "mediasource") {
                        normalHighlighters.push(obj)
                    } else if (urlObj.instance instanceof MediaSource) {
                        mediaSourceHighlighters.push(obj)
                    }
                }
                return { normalHighlighters, mediaSourceHighlighters }
            }
            const { normalHighlighters, mediaSourceHighlighters } = splitHighlightedInstances()

            window.passLinks(normalHighlighters.map((e) => {
                const link = e.getLink()!
                const urlObj = urlMap.get(link)

                return {
                    link,
                    pageUrl: location.href,
                    type: !urlObj ? undefined : urlObj.type as Exclude<typeof urlObj.type, "mediasource">
                }
            }))

            console.log("MEDIA SOURCE PROMISE STARTED...")
            const start = Date.now()
            const mediaSourceData = await Promise.all(mediaSourceHighlighters.map((obj) => {
                const link = obj.getLink()!
                const urlObj = urlMap.get(link)!
                const ms = urlObj.instance as MediaSource
                const checkReadyState = (ms: MediaSource) => {
                    if (ms.readyState === "closed" || ms.readyState === "ended") {
                        const data = mediaSourceMap.get(ms)
                        return data ? {
                            link,
                            readyState: ms.readyState,
                            data: data.data.map((e) => {
                                return {
                                    ...e,
                                    data: new Uint8Array(e.data)
                                }
                            })
                        } : undefined
                    }
                    return undefined
                }

                const result = checkReadyState(ms)

                if (result) {
                    return result
                }

                const promise = new Promise<{ link: string; readyState: ReadyState; data: PassLinksMediaSourceDataType<Uint8Array>['data'] } | undefined>((resolve) => {
                    const handleResolve = () => {
                        console.log("ONE OF MEDIA SOURCE is completed...")
                        resolve(checkReadyState(ms))
                    }
                    ms.addEventListener("sourceclose", handleResolve, { once: true })
                    ms.addEventListener("sourceended", handleResolve, { once: true })
                })

                return promise
            }))
            console.log("MEDIA SOURCE PROMISE COMPLETED...", (Date.now() - start) / 1000, "seconds")
            console.log(mediaSourceData.map(e => e ? e.data.length : "NO DATA").join(", "))

            window.passMediaSource(mediaSourceData.reduce((acc, curr) => {
                if (curr) {
                    const { link, readyState, data } = curr

                    acc[link] = {
                        readyState,
                        data
                    }
                }
                return acc
            }, {} as PassMediaSourceDataType))
        }

        renderHTML(parent?: HTMLElement) {
            const { mediaSourceMap, elements } = this

            const container = elements.container || document.createElement("div")
            const mainText = elements.mainText || document.createElement("p")
            const openMSText = elements.openMSText || document.createElement("span")
            const closeMSText = elements.closeMSText || document.createElement("span")
            const endedMSText = elements.endedMSText || document.createElement("span")
            const downloadAnchor = (elements.downloadAnchor || document.createElement("a")) as HTMLAnchorElement
            this.elements = { container, mainText, openMSText, closeMSText, endedMSText, downloadAnchor }

            container.appendChild(mainText)
            container.appendChild(downloadAnchor)
            mainText.appendChild(openMSText)
            mainText.appendChild(closeMSText)
            mainText.appendChild(endedMSText)

            if (parent && parent.children) {
                parent.appendChild(container)
            }

            container.style.position = "fixed"
            container.style.bottom = "0px"
            container.style.right = "0px"
            container.style.padding = "5px 10px"
            container.style.zIndex = "99999"
            container.style.background = "white"
            container.style.transition = "0.5s"
            container.style.transform = "translateY(calc(100% - 5px))"
            container.onmouseover = () => { container.style.transform = "translateY(0px)" }
            container.onmouseout = () => { container.style.transform = "translateY(calc(100% - 5px))" }

            mainText.style.fontWeight = "700"
            mainText.style.color = "black"

            openMSText.style.color = "green"

            closeMSText.style.color = "red"

            const mediaSourceArr = Array.from(mediaSourceMap.keys())

            const obj = mediaSourceArr.reduce((acc, curr) => {
                if (curr.readyState === "closed") {
                    acc.close.push(curr)
                } else if (curr.readyState === "ended") {
                    acc.ended.push(curr)
                } else if (curr.readyState === "open") {
                    acc.open.push(curr)
                }

                return acc
            }, { open: [] as MediaSource[], close: [] as MediaSource[], ended: [] as MediaSource[] })

            const createTitle = (arr: MediaSource[]) => arr.length > 0 ? arr.map(e => e.duration + 's').join(", ") : ""
            openMSText.innerText = `${obj.open.length} Open`
            openMSText.title = createTitle(obj.open)
            closeMSText.innerText = `${obj.close.length} Closed`
            closeMSText.title = createTitle(obj.close)
            endedMSText.innerText = `${obj.ended.length} Ended`
            endedMSText.title = createTitle(obj.ended)

            // if (!testVideo.src) {

            // }
            downloadAnchor.innerText = "Download"
            downloadAnchor.download = "file.mp4"
            if (obj.ended.length > 0) {
                const ms = obj.ended[0]
                const data = mediaSourceMap.get(ms)!
                const buffers: ArrayBuffer[] = []
                for (let i = 0; i < data.data.length; i++) {
                    const item = data.data[i]
                    if (item.mimeType.includes("video")) {
                        buffers.push(item.data.slice(0))
                    }
                }
                const blob = new Blob(buffers, { type: "video/mp4" })
                const url = URL.createObjectURL(blob)

                downloadAnchor.href = url
            }
        }

    }

    class FreezePage {
        static pageFrozen = false
        static freezeStyleEl: HTMLStyleElement | null = null
        static freezeOverlay: HTMLDivElement | null = null
        static unfreezeFn: (() => void) | null = null

        static freeze() {
            if (this.pageFrozen) return
            this.pageFrozen = true

            document.documentElement.classList.add("page-frozen")

            this.freezeStyleEl = document.createElement("style")
            this.freezeStyleEl.id = "__page-freeze-style"
            this.freezeStyleEl.textContent = `
                html.page-frozen * {
                    transition: none !important;
                    animation-play-state: paused !important;
                }
            `
            document.head.appendChild(this.freezeStyleEl)

            this.freezeOverlay = document.createElement("div")
            this.freezeOverlay.id = "__page-freeze-overlay"
            Object.assign(this.freezeOverlay.style, {
                position: "fixed", inset: "0",
                zIndex: "2147483646",
                cursor: "wait",
                pointerEvents: "all",
                userSelect: "none",
                // background: "transparent",
                background: "rgba(255,255,255,0.8)"
            })
            document.body.appendChild(this.freezeOverlay)

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

    function registerShortcut(keys: string[], callback: (e: KeyboardEvent) => void) {
        document.addEventListener("keydown", function (event) {
            const key = event.key.toLowerCase();

            const conditions = {
                ctrl: event.ctrlKey,
                shift: event.shiftKey,
                alt: event.altKey,
                meta: event.metaKey, // Cmd on Mac
            };

            const mainKey = keys[keys.length - 1].toLowerCase();
            const modifiers = keys.slice(0, -1) as (keyof typeof conditions)[];

            const modifiersMatch = modifiers.every(mod => conditions[mod]);

            if (modifiersMatch && key === mainKey) {
                event.preventDefault();
                callback(event);
            }
        });
    }

    main();
}