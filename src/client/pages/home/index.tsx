import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import useApiHook from "src/client/hooks/useApiHook";
import { browserService } from "src/client/services";
import { BrowserStatus, ResponseProgress } from "src/server/utils/CustomPlaywright";
import cssStyles from "src/client/pages/home/style.module.css";
import { BrowserSocketStatusType } from "src/server/routers/browser/types";
import Header from "src/client/components/Header";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    loading: { dot: "var(--text-dark)", label: "INITIALISING", glow: "none" },
    started: { dot: "var(--theme-success)", label: "RUNNING", glow: "0 0 8px var(--theme-success)" },
    stopped: { dot: "var(--theme-error)", label: "STOPPED", glow: "0 0 8px var(--theme-error)" },
    starting: { dot: "var(--theme-warning)", label: "STARTING", glow: "0 0 8px var(--theme-warning)" },
    stopping: { dot: "var(--theme-warning)", label: "STOPPING", glow: "0 0 8px var(--theme-warning)" },
} as const;

function getStatusConfig(status: BrowserStatus | "loading") {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.loading;
}

export default function Home() {
    const [browserStatus, setBrowserStatus] = useState<BrowserStatus | "loading">("loading");
    const [responseProgress, setResponseProgress] = useState<ResponseProgress>({ total: 0, completed: 0, pending: 0 })
    const [urlValue, setUrlValue] = useState("")
    const { hitApi: startHitApi } = useApiHook({ callback: browserService.start });
    const { data: stoppedData, hitApi: stopHitApi, reset: resetStopHitApi } = useApiHook({ callback: browserService.stop });

    const handleStartBrowser = async () => {
        if (urlValue) {
            try {
                const url = new URL(urlValue)

                await startHitApi({ url: url.href })
            } catch (err) {
                alert((err as Error).message)
            }
        } else {
            await startHitApi()
        }
    }

    useEffect(() => {
        browserService.connectSSE();
        const handler = (data: BrowserSocketStatusType) => {
            if (data.type === "status") {
                setBrowserStatus(data.data)
            } else if (data.type === "pending_promise") {
                setResponseProgress(data.data)
            }
        }
        browserService.subscribe(handler)
        return () => {
            browserService.unsubscribe(handler)
            browserService.disconnectSSE()
        };
    }, []);

    const cfg = getStatusConfig(browserStatus);
    const isLoading = browserStatus === "loading";
    const isStarted = browserStatus === "started";
    //   const isTransitioning = browserStatus === "started" || browserStatus === "stopped";

    return (
        <>

            <div className={cssStyles.homeRoot}>
                {/* ── Top Bar ── */}
                <Header
                    leftComponent={(
                        <span className={cssStyles.topbarLabel}>BROWSER CONTROL</span>
                    )}
                    rightComponent={(
                        <>
                            {!isLoading && (
                                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div
                                        className={`${cssStyles.statusDot} ${cssStyles.pulsing}`}
                                        style={{ background: cfg.dot, boxShadow: cfg.glow, position: "relative" }}
                                    />
                                    <span style={{ fontSize: "9px", color: cfg.dot, letterSpacing: "0.08em", fontFamily: "'JetBrains Mono',monospace" }}>
                                        {cfg.label}
                                    </span>
                                </div>
                            )}
                        </>
                    )}
                />

                {/* ── Main ── */}
                <div className={cssStyles.main}>
                    <div className={cssStyles.card}>
                        <div className={cssStyles.cardHeader}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                <span className={cssStyles.cardHeaderLabel}>SYSTEM / BROWSER</span>
                                <span className={cssStyles.cardHeaderTitle}>Browser Control</span>
                            </div>
                            <div style={{ marginLeft: "auto" }}>
                                <span
                                    className={cssStyles.statusBadge}
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

                        <div className={cssStyles.cardBody}>
                            <div className={cssStyles.statusBlock}>
                                <div className={cssStyles.statusRow}>
                                    <div className={cssStyles.statusLeft}>
                                        <div className={cssStyles.statusDotWrap}>
                                            <div
                                                className={`${cssStyles.statusDot} ${!isLoading ? cssStyles.pulsing : ""}`}
                                                style={{ background: cfg.dot, boxShadow: cfg.glow }}
                                            />
                                        </div>
                                        <span className={cssStyles.statusLabel}>
                                            {isLoading ? "Connecting to daemon…" : `Browser is ${cfg.label.toLowerCase()}`}
                                        </span>
                                    </div>
                                </div>

                                <div className={cssStyles.statusBarTrack}>
                                    <div
                                        className={cssStyles.statusBarFill}
                                        style={{
                                            width: isLoading ? "30%" : isStarted ? "100%" : "0%",
                                            background: isLoading
                                                ? "#1e2433"
                                                : isStarted
                                                    ? `linear-gradient(to right, var(--theme-success), var(--theme-info))`
                                                    : "var(--theme-error)",
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <input
                                    className={cssStyles.navLink}
                                    style={{ outline: "none", width: "100%" }}
                                    placeholder="Enter page URL (Optional)"
                                    type="url"
                                    value={urlValue}
                                    onChange={(e) => { setUrlValue(e.target.value) }}
                                />
                            </div>

                            {isLoading ? (
                                <button className={`${cssStyles.actionBtn} ${cssStyles.loadingState}`} disabled>
                                    <span className={cssStyles.btnIcon} style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span>
                                    LOADING…
                                </button>
                            ) : isStarted ? (
                                <button
                                    className={`${cssStyles.actionBtn} ${cssStyles.stop}`}
                                    onClick={() => { resetStopHitApi(); stopHitApi() }}
                                    disabled={isLoading || stoppedData?.success === true}
                                >
                                    <span className={cssStyles.btnIcon}>■</span>
                                    STOP BROWSER {responseProgress.pending > 0 ? `(${responseProgress.pending}/${responseProgress.total} pending)` : ""}
                                </button>
                            ) : (
                                <button
                                    className={`${cssStyles.actionBtn} ${cssStyles.start}`}
                                    onClick={handleStartBrowser}
                                    disabled={isLoading}
                                >
                                    <span className={cssStyles.btnIcon}>▶</span>
                                    START BROWSER
                                </button>
                            )}

                            <div className={cssStyles.divider} />

                            <div className={cssStyles.navSection}>
                                <div className={cssStyles.navSectionLabel}>NAVIGATION</div>
                                <Link to="/videos" className={cssStyles.navLink}>
                                    <div className={cssStyles.navLinkDot} style={{ background: "var(--theme-info)" }} />
                                    Videos
                                    <span className={cssStyles.navLinkArrow}>→</span>
                                </Link>
                            </div>
                        </div>

                        <div className={cssStyles.cardFooter}>
                            <span className={cssStyles.footerKey}>S</span>
                            <span className={cssStyles.footerHint}>start</span>
                            <span style={{ margin: "0 4px", color: "#1e2433", fontSize: "8px" }}>·</span>
                            <span className={cssStyles.footerKey}>X</span>
                            <span className={cssStyles.footerHint}>stop</span>
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