import { createContext, CSSProperties, ReactNode, useContext, useId, useRef, useState } from "react";
import { TabsColor, TabsVariant } from "src/client/components/Tabs/types";
import { cx } from "src/client/components/Tabs/helpers";
import styles from "src/client/components/Tabs/style.module.css";


interface TabsCtx {
    activeValue: string;
    setActive: (v: string) => void;
    uid: string;
    color: TabsColor;
    variant: TabsVariant;
    registerTab: (value: string, el: HTMLButtonElement | null) => void;
}

const TabsContext = createContext<TabsCtx | null>(null);

export const useTabsCtx = () => {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error('<Tab> / <TabPanel> must be inside <Tabs>');
    return ctx;
};

export interface TabsProps {
    /** Controlled active tab value */
    value?: string;
    /** Default value for uncontrolled usage */
    defaultValue?: string;
    onChange?: (value: string) => void;
    color?: TabsColor;
    variant?: TabsVariant;
    className?: string;
    style?: CSSProperties;
    children: ReactNode;
}

export default function Tabs({
    value,
    defaultValue = '',
    onChange,
    color = 'info',
    variant = 'underline',
    className,
    style,
    children,
}: TabsProps) {
    const uid = useId().replace(/:/g, '');
    const [internal, setInternal] = useState(defaultValue);
    const active = value !== undefined ? value : internal;
    const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

    const setActive = (v: string) => {
        if (value === undefined) setInternal(v);
        onChange?.(v);
    };

    const registerTab = (v: string, el: HTMLButtonElement | null) => {
        if (el) tabRefs.current.set(v, el);
        else tabRefs.current.delete(v);
    };

    return (
        <TabsContext.Provider value={{ activeValue: active, setActive, uid, color, variant, registerTab }}>
            <div className={cx(styles.root, className)} style={style}>
                {children}
            </div>
        </TabsContext.Provider>
    );
};