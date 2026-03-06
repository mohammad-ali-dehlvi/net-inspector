import type { GetExtensionFunc, PassDataFunc } from "src/server/utils/CustomPlaywright/types";
import { FreezePage } from "./freezePage";
import { Highlighter } from "./highlighter";
import { MediaSourceDashboard } from "./mediaSourceDashboard";
import { registerShortcut } from "./functions";


declare global {
    interface Window {
        getExtension: GetExtensionFunc
        passData: PassDataFunc
    }
}

// @ts-ignore
window.__name = (fn: Function, name: string) =>
    Object.defineProperty(fn, "name", { value: name, configurable: true });

const OriginalMediaSource = window.MediaSource;
const originalAddSourceBuffer = MediaSource.prototype.addSourceBuffer;

const mediaSourceDashboard = new MediaSourceDashboard()

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
    const elements = document.elementsFromPoint(mouse.x, mouse.y) as HTMLElement[]

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