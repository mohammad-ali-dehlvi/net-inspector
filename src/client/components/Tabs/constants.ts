import styles from "src/client/components/Tabs/style.module.css";
import { TabsColor } from "src/client/components/Tabs/types";
import { cx } from "src/client/components/Tabs/helpers";

export const SELECTED_CLASS: Record<TabsColor, string> = {
    info: styles.tabSelected,
    success: styles.tabSelectedSuccess,
    warning: styles.tabSelectedWarning,
    error: styles.tabSelectedError,
};

export const BADGE_SELECTED_CLASS: Record<TabsColor, string> = {
    info: styles.badgeSelectedInfo,
    success: styles.badgeSelectedSuccess,
    warning: styles.badgeSelectedWarning,
    error: styles.badgeSelectedError,
};

export const INDICATOR_CLASS: Record<TabsColor, string> = {
    info: styles.indicator,
    success: cx(styles.indicator, styles.indicatorSuccess),
    warning: cx(styles.indicator, styles.indicatorWarning),
    error: cx(styles.indicator, styles.indicatorError),
};