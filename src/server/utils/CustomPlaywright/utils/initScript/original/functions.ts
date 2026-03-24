

export function registerShortcut(keys: string[], callback: (e: KeyboardEvent) => void, ele?: HTMLElement) {
    (ele || document).addEventListener("keydown", function (e) {
        const event = e as KeyboardEvent
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
    }, true);
}