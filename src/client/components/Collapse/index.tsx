import React, {
    ReactNode,
    CSSProperties,
    useRef,
    useEffect,
    useState,
    useCallback,
} from "react";
import styles from "src/client/components/Collapse/style.module.css";

export interface CollapseProps {
    /** Content to show/hide */
    children: ReactNode;
    /** If `true`, the component will transition in */
    in: boolean;
    /** Collapse orientation. Default is "vertical" */
    orientation?: "vertical" | "horizontal";
    /** Additional class name applied to the root element */
    className?: string;
    /** Inline styles applied to the root element */
    style?: CSSProperties;
}

const Collapse: React.FC<CollapseProps> = ({
    children,
    in: inProp,
    orientation = "vertical",
    className,
    style,
}) => {
    const isVertical = orientation === "vertical";
    const innerRef = useRef<HTMLDivElement>(null);
    const [size, setSize] = useState<number>(0);

    /**
     * Measure the inner content size (width or height) so we can
     * animate to a concrete pixel value instead of "auto".
     */
    const measure = useCallback(() => {
        if (!innerRef.current) return;
        const value = isVertical
            ? innerRef.current.scrollHeight
            : innerRef.current.scrollWidth;
        setSize(value);
    }, [isVertical]);

    useEffect(() => {
        measure();
    }, [children, measure]);

    // Re-measure on window resize
    useEffect(() => {
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [measure]);

    const rootClasses = [
        styles.collapse,
        isVertical ? styles.collapseVertical : styles.collapseHorizontal,
        inProp
            ? isVertical
                ? styles.collapseVerticalIn
                : styles.collapseHorizontalIn
            : undefined,
        className,
    ]
        .filter(Boolean)
        .join(" ");

    const innerClasses = [
        styles.inner,
        isVertical ? styles.innerVertical : styles.innerHorizontal,
    ].join(" ");

    const rootStyle: CSSProperties = {
        "--collapse-size": `${size}px`,
        ...style,
    } as CSSProperties;

    return (
        <div className={rootClasses} style={rootStyle} aria-hidden={!inProp}>
            <div ref={innerRef} className={innerClasses}>
                {children}
            </div>
        </div>
    );
};

export default Collapse;