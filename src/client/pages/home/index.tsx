import { useEffect, useState } from "react";
import { Link } from "react-router";
import useApiHook from "src/client/hooks/useApiHook";
import { browserService } from "src/client/services";
import { BrowserStatus } from "src/server/utils/CustomPlaywright";
import "src/client/pages/home/index.css";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    loading: { dot: "#4a5568", label: "INITIALISING", glow: "none" },
    started: { dot: "#4ade80", label: "RUNNING", glow: "0 0 8px #4ade80" },
    stopped: { dot: "#f87171", label: "STOPPED", glow: "0 0 8px #f87171" },
    starting: { dot: "#fb923c", label: "STARTING", glow: "0 0 8px #fb923c" },
    stopping: { dot: "#fb923c", label: "STOPPING", glow: "0 0 8px #fb923c" },
} as const;

function getStatusConfig(status: BrowserStatus | "loading") {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.loading;
}

export default function Home() {
    const [browserStatus, setBrowserStatus] = useState<BrowserStatus | "loading">("loading");
    const [urlValue, setUrlValue] = useState("")
    const { hitApi: startHitApi } = useApiHook({ callback: browserService.start });
    const { hitApi: stopHitApi } = useApiHook({ callback: browserService.stop });

    const handleStartBrowser = async () => {
        if (urlValue) {
            try{
                const url = new URL(urlValue)
                console.log(url)
                await startHitApi({url: url.href})
            }catch(err){
                alert((err as Error).message)
            }
        }else{
            await startHitApi()
        }
    }

    useEffect(() => {
        const closeSocket = browserService.status((status) => {
            setBrowserStatus(status);
        });
        return () => { closeSocket(); };
    }, []);

    const cfg = getStatusConfig(browserStatus);
    const isLoading = browserStatus === "loading";
    const isStarted = browserStatus === "started";
    //   const isTransitioning = browserStatus === "started" || browserStatus === "stopped";

    return (
        <>

            <div className="home-root">
                {/* ── Top Bar ── */}
                <div className="topbar">
                    <div className="topbar-logo">
                        <div className="topbar-dot" />
                        <span className="topbar-title">NET INSPECTOR</span>
                    </div>
                    <div className="topbar-divider" />
                    <span className="topbar-label">BROWSER CONTROL</span>

                    {/* Live status pill in topbar */}
                    {!isLoading && (
                        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
                            <div
                                // className={`status-dot ${isTransitioning ? "spinning" : "pulsing"}`}
                                className={`status-dot pulsing`}
                                style={{ background: cfg.dot, boxShadow: cfg.glow, position: "relative" }}
                            />
                            <span style={{ fontSize: "9px", color: cfg.dot, letterSpacing: "0.08em", fontFamily: "'JetBrains Mono',monospace" }}>
                                {cfg.label}
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Main ── */}
                <div className="main">
                    <div className="card">

                        {/* Card header */}
                        <div className="card-header">
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                <span className="card-header-label">SYSTEM / BROWSER</span>
                                <span className="card-header-title">Browser Control</span>
                            </div>
                            <div style={{ marginLeft: "auto" }}>
                                <span
                                    className="status-badge"
                                    style={{
                                        background: `${cfg.dot}18`,
                                        border: `1px solid ${cfg.dot}40`,
                                        color: cfg.dot,
                                    }}
                                >
                                    {cfg.label}
                                </span>
                            </div>
                        </div>

                        {/* Card body */}
                        <div className="card-body">

                            {/* Status section */}
                            <div className="status-block">
                                <div className="status-row">
                                    <div className="status-left">
                                        <div className="status-dot-wrap">
                                            <div
                                                // className={`status-dot ${isTransitioning ? "spinning" : isLoading ? "" : "pulsing"}`}
                                                className={`status-dot ${isLoading ? "" : "pulsing"}`}
                                                style={{ background: cfg.dot, boxShadow: cfg.glow }}
                                            />
                                        </div>
                                        <span className="status-label">
                                            {isLoading ? "Connecting to daemon…" : `Browser is ${cfg.label.toLowerCase()}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Status progress bar */}
                                <div className="status-bar-track">
                                    <div
                                        className="status-bar-fill"
                                        style={{
                                            //   width: isLoading ? "30%" : isStarted ? "100%" : isTransitioning ? "60%" : "0%",
                                            width: isLoading ? "30%" : isStarted ? "100%" : "0%",
                                            background: isLoading
                                                ? "#1e2433"
                                                : isStarted
                                                    ? `linear-gradient(to right, #4ade80, #60a5fa)`
                                                    // : isTransitioning
                                                    // ? "#fb923c"
                                                    : "#f87171",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Input button */}
                            <div>
                                <input 
                                className="nav-link" 
                                style={{outline: "none", width: "100%"}} 
                                placeholder="Enter page URL (Optional)" 
                                type="url"
                                value={urlValue}
                                onChange={(e)=>{setUrlValue(e.target.value)}}
                                />
                            </div>

                            {/* Action button */}
                            {isLoading ? (
                                <button className="action-btn loading-state" disabled>
                                    <span className="btn-icon" style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span>
                                    LOADING…
                                </button>
                            ) : isStarted ? (
                                <button
                                    className="action-btn stop"
                                    onClick={() => stopHitApi()}
                                    //   disabled={isTransitioning}
                                    disabled={isLoading}
                                >
                                    <span className="btn-icon">■</span>
                                    STOP BROWSER
                                </button>
                            ) : (
                                <button
                                    className="action-btn start"
                                    onClick={handleStartBrowser}
                                    //   disabled={isTransitioning}
                                    disabled={isLoading}
                                >
                                    <span className="btn-icon">▶</span>
                                    START BROWSER
                                </button>
                            )}

                            {/* Divider */}
                            <div className="divider" />

                            {/* Navigation */}
                            <div className="nav-section">
                                <div className="nav-section-label">NAVIGATION</div>
                                <Link to="/videos" className="nav-link">
                                    <div className="nav-link-dot" style={{ background: "#60a5fa" }} />
                                    Videos
                                    <span className="nav-link-arrow">→</span>
                                </Link>
                            </div>

                        </div>

                        {/* Card footer */}
                        <div className="card-footer">
                            <span className="footer-key">S</span>
                            <span className="footer-hint">start</span>
                            <span style={{ margin: "0 4px", color: "#1e2433", fontSize: "8px" }}>·</span>
                            <span className="footer-key">X</span>
                            <span className="footer-hint">stop</span>
                            <div style={{ marginLeft: "auto", fontSize: "8px", color: "#1e2433", letterSpacing: "0.06em" }}>
                                v1.0.0
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}