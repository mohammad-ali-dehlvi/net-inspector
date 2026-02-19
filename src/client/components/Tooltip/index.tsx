import React, { useState, useRef, useLayoutEffect, useEffect, ReactElement, JSXElementConstructor } from 'react';
import { createPortal } from 'react-dom';

export type Placement = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps<P, T extends string | JSXElementConstructor<any>> {
    // Enforcing a single ReactElement instead of a general ReactNode
    children: ReactElement<P, T>;
    title: React.ReactNode;
    position?: Placement;
}

export default function Tooltip<P extends object, T extends string | JSXElementConstructor<any>>({ children, title, position = 'bottom' }: TooltipProps<P, T>) {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    // Changed to HTMLElement to accommodate any tag (button, div, a, etc.)
    const triggerRef = useRef<HTMLElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    const showTooltip = () => setIsVisible(true);
    const hideTooltip = () => setIsVisible(false);

    useEffect(() => {
        if (isVisible) {
            window.addEventListener('scroll', hideTooltip, true);
            return () => window.removeEventListener('scroll', hideTooltip, true);
        }
    }, [isVisible]);

    useLayoutEffect(() => {
        if (isVisible && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();

            const margin = 8;
            const padding = 10;

            let activePosition = position;
            let top = 0;
            let left = 0;

            // 1. Collision Detection
            if (position === 'top' && triggerRect.top - tooltipRect.height - margin < 0) {
                activePosition = 'bottom';
            } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height + margin > window.innerHeight) {
                activePosition = 'top';
            } else if (position === 'left' && triggerRect.left - tooltipRect.width - margin < 0) {
                activePosition = 'right';
            } else if (position === 'right' && triggerRect.right + tooltipRect.width + margin > window.innerWidth) {
                activePosition = 'left';
            }

            // 2. Coordinate Calculation
            switch (activePosition) {
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
            // Preserve any existing onMouseEnter passed directly to the child
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
            hideTooltip();
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
                        style={{
                            position: 'absolute',
                            top: `${coords.top}px`,
                            left: `${coords.left}px`,
                            backgroundColor: 'rgba(97, 97, 97, 0.92)',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontFamily: 'inherit',
                            pointerEvents: 'none',
                            whiteSpace: 'nowrap',
                            zIndex: 9999,
                            boxShadow: '0px 2px 4px rgba(0,0,0,0.2)',
                        }}
                    >
                        {title}
                    </div>,
                    document.body
                )}
        </>
    );
};