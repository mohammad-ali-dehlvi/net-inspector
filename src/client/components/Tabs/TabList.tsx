import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";
import { cx } from "src/client/components/Tabs/helpers";
import styles from "src/client/components/Tabs/style.module.css";
import { useTabsCtx } from "src/client/components/Tabs/Tabs";
import { INDICATOR_CLASS } from "src/client/components/Tabs/constants";

export interface TabListProps {
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}

export default function TabList({ className, style, children }: TabListProps) {
    const { activeValue, color, variant } = useTabsCtx();
    const listRef = useRef<HTMLDivElement>(null);
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });

    useEffect(() => {
        if (variant === 'pills') return;
        const list = listRef.current;
        if (!list) return;
        const activeEl = list.querySelector<HTMLElement>('[aria-selected="true"]');
        if (activeEl) {
            const listRect = list.getBoundingClientRect();
            const tabRect = activeEl.getBoundingClientRect();
            setIndicator({ left: tabRect.left - listRect.left, width: tabRect.width });
        }
    }, [activeValue, variant]);

    const listClass = cx(
        styles.list,
        variant === 'pills' && styles.listPills,
        variant === 'flush' && styles.listFlush,
        className,
    );

    return (
        <div ref={listRef} className={listClass} role="tablist" style={style}>
            {children}
            {variant !== 'pills' && (
                <span
                    className={INDICATOR_CLASS[color]}
                    style={{ left: indicator.left, width: indicator.width }}
                    aria-hidden
                />
            )}
        </div>
    );
};