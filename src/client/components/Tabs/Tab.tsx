
import { CSSProperties, ReactNode, useEffect, useRef } from "react";
import { cx } from "src/client/components/Tabs/helpers";
import styles from "src/client/components/Tabs/style.module.css";
import { useTabsCtx } from "src/client/components/Tabs/Tabs";
import { BADGE_SELECTED_CLASS, INDICATOR_CLASS, SELECTED_CLASS } from "src/client/components/Tabs/constants";

export interface TabProps {
    /** Must match a corresponding <TabPanel value="..."> */
    value: string;
    disabled?: boolean;
    icon?: ReactNode;
    badge?: string | number;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}

export const Tab: React.FC<TabProps> = ({
    value,
    disabled = false,
    icon,
    badge,
    className,
    style,
    children,
}) => {
    const { activeValue, setActive, uid, color, variant, registerTab } = useTabsCtx();
    const selected = activeValue === value;
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        registerTab(value, ref.current);
        return () => registerTab(value, null);
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        const list = ref.current?.closest('[role="tablist"]');
        if (!list) return;
        const tabs = Array.from(
            list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])'),
        );
        const idx = tabs.indexOf(ref.current!);
        if (e.key === 'ArrowRight') { e.preventDefault(); tabs[(idx + 1) % tabs.length]?.focus(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); tabs[(idx - 1 + tabs.length) % tabs.length]?.focus(); }
        if (e.key === 'Home') { e.preventDefault(); tabs[0]?.focus(); }
        if (e.key === 'End') { e.preventDefault(); tabs[tabs.length - 1]?.focus(); }
    };

    const tabClass = cx(
        styles.tab,
        variant === 'pills' && styles.tabPills,
        variant === 'flush' && styles.tabFlush,
        selected && SELECTED_CLASS[color],
        selected && variant === 'pills' && styles.tabPillsSelected,
        className,
    );

    const badgeClass = cx(
        styles.badge,
        selected && BADGE_SELECTED_CLASS[color],
    );

    return (
        <button
            ref={ref}
            role="tab"
            id={`tab-${uid}-${value}`}
            aria-controls={`panel-${uid}-${value}`}
            aria-selected={selected}
            disabled={disabled}
            tabIndex={selected ? 0 : -1}
            className={tabClass}
            style={style}
            onClick={() => !disabled && setActive(value)}
            onKeyDown={handleKeyDown}
        >
            {icon && <span className={styles.icon}>{icon}</span>}
            {children}
            {badge !== undefined && <span className={badgeClass}>{badge}</span>}
        </button>
    );
};