import { ReactNode, useMemo, CSSProperties } from "react";
import cssStyles from "src/client/components/Chip/style.module.css";


interface ChipProps {
    children: ReactNode
    style?: CSSProperties
    className?: string
    variant?: "success" | "warning" | "info" | "error" | "active"
    removeBorder?: boolean
    removeBackground?: boolean
    onClick?: () => void
}

export default function Chip(props: ChipProps) {
    const { children, className, style, variant, removeBorder, removeBackground, onClick } = props

    const variantClassName = useMemo(() => {
        switch (variant) {
            case "success":
                return cssStyles.chipSuccess;
            case "warning":
                return cssStyles.chipWarning;
            case "info":
                return cssStyles.chipInfo;
            case "error":
                return cssStyles.chipError
            case "active":
                return cssStyles.chipActive
            default:
                return ""
        }
    }, [variant])

    return (
        <button
            onClick={onClick}
            className={`${cssStyles.chipBase} ${variantClassName} ${removeBorder ? cssStyles.chipRemoveBorder : ""} ${removeBackground ? cssStyles.chipRemoveBackground : ""} ${className}`}
            style={style}
        // style={{
        //     background: removeBackground ? "transparent" : undefined,
        //     border: removeBorder ? "0px solid transparent" : undefined
        // }}
        //   style={{
        //     borderColor: active ? `${color}60` : undefined,
        //     background: active ? `${color}18` : undefined,
        //     color: active ? color : undefined,
        //     boxShadow: active ? `0 0 8px ${color}22` : "none",
        //   }}
        >
            {children}
        </button>
    )
}