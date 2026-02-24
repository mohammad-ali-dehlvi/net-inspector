import React, { useState, useRef, useLayoutEffect, useEffect, ReactElement, JSXElementConstructor, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import cssStyles from "src/client/components/Tooltip/style.module.css"

export type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps<P, T extends string | JSXElementConstructor<any>> {
    // Enforcing a single ReactElement instead of a general ReactNode
    children: ReactElement<P, T>;
    title: React.ReactNode;
    position?: Placement;
    arrow?: boolean;
    titleStyle?: CSSProperties
    arrowStyle?: CSSProperties
}

export default function Tooltip<P extends object, T extends string | JSXElementConstructor<any>>({ children, title, position = 'bottom', arrow = false, titleStyle = {}, arrowStyle = {} }: TooltipProps<P, T>) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [activePosition, setActivePosition] = useState<Placement>(position);

    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showTooltip = () => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
        setIsVisible(true);
    };

    // MUI uses a short delay (200ms) before hiding to allow mouse to travel to tooltip
    const hideTooltip = (delay = 200) => {
        hideTimerRef.current = setTimeout(() => {
            setIsVisible(false);
        }, delay);
    };

    const hideTooltipImmediate = () => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
        setIsVisible(false);
    };

    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (isVisible) {
            const handler = (e: Event) => {
                // Don't hide if the scroll happened inside the tooltip itself
                if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) return;
                hideTooltipImmediate();
            };
            window.addEventListener('scroll', handler, true);
            return () => window.removeEventListener('scroll', handler, true);
        }
    }, [isVisible]);

    useLayoutEffect(() => {
        if (isVisible && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            const margin = 8;
            const padding = 10;

            let resolvedPosition = position;
            let top = 0;
            let left = 0;

            // 1. Collision Detection
            if (position === 'top' && triggerRect.top - tooltipRect.height - margin < 0) {
                resolvedPosition = 'bottom';
            } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + margin > window.innerHeight) {
                resolvedPosition = 'top';
            } else if (position === 'left' && triggerRect.left - tooltipRect.width - margin < 0) {
                resolvedPosition = 'right';
            } else if (position === 'right' && triggerRect.right + tooltipRect.width + margin > window.innerWidth) {
                resolvedPosition = 'left';
            }

            // 2. Coordinate Calculation
            switch (resolvedPosition) {
                case 'top':
                    top = triggerRect.top - tooltipRect.height - margin;
                    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    top = triggerRect.bottom + margin;
                    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                    left = triggerRect.left - tooltipRect.width - margin;
                    break;
                case 'right':
                    top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                    left = triggerRect.right + margin;
                    break;
            }

            // 3. Viewport Shift
            if (left < padding) left = padding;
            else if (left + tooltipRect.width > window.innerWidth - padding) left = window.innerWidth - tooltipRect.width - padding;

            if (top < padding) top = padding;
            else if (top + tooltipRect.height > window.innerHeight - padding) top = window.innerHeight - tooltipRect.height - padding;

            // 4. Set Coordinates
            setActivePosition(resolvedPosition);
            setCoords({
                top: top + window.scrollY,
                left: left + window.scrollX,
            });
        }
    }, [isVisible, position, title]);

    // Ensure children is a valid React element before cloning
    if (!React.isValidElement(children)) {
        return children;
    }

    // Clone the element to inject our ref and event handlers securely
    const clonedChild = React.cloneElement(children as React.ReactElement<any>, {
        ref: triggerRef,
        onMouseEnter: (e: React.MouseEvent) => {
            showTooltip();
            if ("onMouseEnter" in children.props && typeof children.props.onMouseEnter === "function") children.props.onMouseEnter(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
            hideTooltip();
            if ("onMouseLeave" in children.props && typeof children.props.onMouseLeave === "function") children.props.onMouseLeave(e);
        },
        onFocus: (e: React.FocusEvent) => {
            showTooltip();
            if ("onFocus" in children.props && typeof children.props.onFocus === "function") children.props.onFocus(e);
        },
        onBlur: (e: React.FocusEvent) => {
            hideTooltipImmediate();
            if ("onBlur" in children.props && typeof children.props.onBlur === "function") children.props.onBlur(e);
        },
    });

    return (
        <>
            {clonedChild}
            {isVisible &&
                createPortal(
                    <div
                        ref={tooltipRef}
                        className={`${cssStyles.tooltip}`}
                        style={{
                            position: 'absolute',
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                        }}
                        onMouseEnter={showTooltip}
                        onMouseLeave={() => hideTooltip()}
                    >
                        {arrow && <span className={`${cssStyles.arrow} ${cssStyles[`arrow__${activePosition}`]}`} style={{ ...arrowStyle }} />}
                        <div className={cssStyles.tooltipContent} style={{ ...titleStyle, }} >{title}</div>
                    </div>,
                    document.body
                )}
        </>
    );
};