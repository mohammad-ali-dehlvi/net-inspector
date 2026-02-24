import { CSSProperties, ReactNode } from "react";
import { cx } from "src/client/components/Tabs/helpers";
import styles from "src/client/components/Tabs/style.module.css";

export interface TabPanelProps {
    value: string;
    activeValue: string;
    /** Keep hidden panels in the DOM instead of unmounting them */
    keepMounted?: boolean;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}

export const TabPanel: React.FC<TabPanelProps> = ({
    value,
    activeValue,
    keepMounted = false,
    className,
    style,
    children,
}) => {
    const active = activeValue === value;

    if (!active && !keepMounted) return null;

    return (
        <div
            role="tabpanel"
            id={`panel-${value}`}
            aria-labelledby={`tab-${value}`}
            tabIndex={0}
            hidden={!active}
            // key forces remount → re-triggers the fade-in animation on each switch
            key={value}
            className={cx(styles.panel, className)}
            style={style}
        >
            {children}
        </div>
    );
};