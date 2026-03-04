import { CustomElement } from "./frontend";

export class Highlighter {
    ele: CustomElement<HTMLElement>
    highlighter: CustomElement<HTMLDivElement> | null = null
    highlighterText: CustomElement<HTMLDivElement> | null = null
    highlighterControls: CustomElement<HTMLDivElement> | null = null
    constructor(ele: HTMLElement) {
        this.ele = new CustomElement(ele);
        const main = this.getOrCreateHighlighter()
        const text = this.getOrCreateHighlighterText()
        // const controls = this.getOrCreateHighlighterControls()

        text.addTo(main)
        main.appendChild(text)
        // main.appendChild(controls)

        if (!document.body) {
            const handleContentLoaded = () => {
                main.addTo(document.body)
                setTimeout(() => {
                    document.removeEventListener("DOMContentLoaded", handleContentLoaded)
                })
            }
            document.addEventListener("DOMContentLoaded", handleContentLoaded)
        } else {
            main.addTo(document.body)
        }
    }

    public getLink() {
        const { ele: { element: ele } } = this

        return "src" in ele ?
            ele.src as string :
            "href" in ele ?
                ele.href as string :
                null
    }

    private getOrCreateHighlighter() {
        if (this.highlighter) return this.highlighter

        const highlighter = new CustomElement(document.createElement("div"));
        highlighter
            .setId(`highlighter-${Highlighter.instances.length}`)
            .setStyles({
                pointerEvents: "none",
                display: "none",
                position: "fixed",
                top: "0px",
                left: "0px",
                width: "0px",
                height: "0px",
                border: "2px solid red"
            })

        this.highlighter = highlighter

        return highlighter
    }

    private getOrCreateHighlighterText() {
        if (this.highlighterText) return this.highlighterText

        const highlighterText = new CustomElement(document.createElement("div"));
        highlighterText
            .setId(`highlighter-text-${Highlighter.instances.length}`)
            .setStyles({
                pointerEvents: "auto",
                display: "inline-block",
                position: "absolute",
                top: "0px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "red",
                color: "white",
                fontWeight: "700"
            })

        this.highlighterText = highlighterText

        return highlighterText
    }

    private getOrCreateHighlighterControls() {
        if (this.highlighterControls) return this.highlighterControls

        const highlighterControls = new CustomElement(document.createElement("div"));
        highlighterControls
            .setId(`highlighter-controls-${Highlighter.instances.length}`)
            .setStyles({
                pointerEvents: "auto",
                padding: "5px 10px",
                borderRadius: "5px",
                background: "rgba(255,255,255,1)",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
            })

        this.highlighterControls = highlighterControls

        return highlighterControls
    }

    createBorder() {
        const { ele, highlighter, highlighterText } = this

        if (!highlighter || !highlighterText) return

        const rect = ele.element.getBoundingClientRect()
        highlighter.setStyles({
            display: "block",
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            zIndex: "9999999",
        })
        // .setInnerText(ele.element.tagName)


        highlighterText
            .setInnerText(ele.element.tagName)
            .setTitle(this.getLink() || "LINK NOT FOUND")
    }

    remove() {
        const { highlighter } = this
        if (!highlighter) return

        // highlighter.style.display = "none"
        highlighter.remove()
    }

    static instances: Highlighter[] = []
    static getOrCreateInstances(eleList: HTMLElement[]) {
        const result: typeof Highlighter.instances = []

        for (let i = 0; i < eleList.length; i++) {
            const ele = eleList[i]

            const ins = Highlighter.instances.find(e => e.ele.element === ele)
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