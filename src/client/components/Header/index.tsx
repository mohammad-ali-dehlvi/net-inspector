import { JSX } from "react";
import { Link } from "react-router";
import cssStyles from "src/client/components/Header/style.module.css";


interface HeaderProps {
    leftComponent?: JSX.Element
    rightComponent?: JSX.Element
}

export default function Header(props: HeaderProps) {
    const { leftComponent, rightComponent } = props

    return (
        <div className={cssStyles.topBar}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--theme-success)", boxShadow: "0 0 6px var(--theme-success)" }} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", fontWeight: 800, letterSpacing: "0.12em" }}>NET INSPECTOR</span>
            </div>
            <div style={{ height: "14px", width: "1px", background: "#1e2433" }} />
            {leftComponent}
            {!!rightComponent && (
                <div style={{ marginLeft: "auto" }} >
                    {rightComponent}
                </div>
            )}
        </div>
    )
}