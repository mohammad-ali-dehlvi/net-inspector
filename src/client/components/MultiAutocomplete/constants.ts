import { CSSProperties } from "react";


export const mergeStyle = (...styles: (CSSProperties | undefined)[]): CSSProperties =>
    Object.assign({}, ...styles.filter(Boolean));


export const mergeClassName = (...classNames: (string | undefined)[]): string =>
    classNames.filter(Boolean).join(" ");