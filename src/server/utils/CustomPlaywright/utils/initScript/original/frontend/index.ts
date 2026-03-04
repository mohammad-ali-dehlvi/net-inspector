

export class CustomElement<T extends HTMLElement> {
    name: keyof HTMLElementTagNameMap
    element: T
    constructor(param: T | keyof HTMLElementTagNameMap) {
        if (param instanceof HTMLElement) {
            this.name = param.tagName.toLowerCase() as keyof HTMLElementTagNameMap
            this.element = param
        } else {
            this.name = param
            this.element = document.createElement(this.name) as T
        }
    }

    setId(id: string | ((id: string) => string)) {
        if (typeof id === "string") {
            this.element.id = id
        } else {
            const prev = this.element.id
            this.element.id = id(prev)
        }
        return this
    }

    getClassList() {
        return this.element.classList
    }

    addTo(parent: HTMLElement | CustomElement<HTMLElement>) {
        const { element } = this
        if (!parent.contains(element)) {
            parent.appendChild(element)
        }
        return this
    }

    appendChild(ele: HTMLElement | CustomElement<HTMLElement>) {
        const { element } = this
        if (ele instanceof HTMLElement && !element.contains(ele)) {
            element.appendChild(ele)
        } else if (ele instanceof CustomElement) {
            this.appendChild(ele.element)
        }
        return this
    }

    contains(ele: HTMLElement | CustomElement<HTMLElement>): boolean {
        const { element } = this
        if (ele instanceof HTMLElement) {
            return element.contains(ele)
        } else {
            return this.contains(ele.element)
        }
    }

    setTitle(title: string | ((title: string) => string)) {
        if (typeof title === "string") {
            this.element.title = title
        } else {
            const prev = this.element.title
            this.element.title = title(prev)
        }
        return this
    }


    setInnerHTML(param: string | ((html: string) => string)) {
        if (typeof param === "string") {
            this.element.innerHTML = param
        } else {
            const prev = this.element.innerHTML
            this.element.innerHTML = param(prev)
        }
        return this
    }

    setInnerText(param: string | ((text: string) => string)) {
        if (typeof param === "string") {
            this.element.innerText = param
        } else {
            const prev = this.element.innerText
            this.element.innerText = param(prev)
        }
        return this
    }

    setStyles(obj: Partial<CSSStyleDeclaration>) {
        for (let key in obj) {
            this.element.style[key] = obj[key] as string
        }
        return this
    }

    getParent() {
        return this.element.parentElement
    }

    remove() {
        this.element.remove()
    }
}