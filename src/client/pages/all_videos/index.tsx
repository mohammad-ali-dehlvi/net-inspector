import { useEffect } from "react";
import { Link } from "react-router";
import useApiHook from "src/client/hooks/useApiHook";
import { videoService } from "src/client/services";
import "src/client/pages/all_videos/index.css";

export default function AllVideos() {
  const { data, loading, error, hitApi } = useApiHook({ callback: videoService.getNameList });

  useEffect(() => {
    hitApi();
  }, []);

  const videos = data?.success ? data.data.names : [];

  return (
    <>

      <div className="av-root">
        {/* ── Top Bar ── */}
        <div className="topbar">
          <Link to="/" className="topbar-logo">
            <div className="topbar-dot" />
            <span className="topbar-title">NET INSPECTOR</span>
          </Link>
          <div className="topbar-divider" />
          <div className="topbar-crumb">
            <Link to="/" style={{ color: "#2d3748", textDecoration: "none", letterSpacing: "0.06em" }}>HOME</Link>
            <span className="topbar-crumb-sep">/</span>
            <span className="topbar-crumb-active">VIDEOS</span>
          </div>

          {/* Count badge when loaded */}
          {data?.success && (
            <span className="topbar-count" style={{ animation: "fadeIn .2s ease" }}>
              {videos.length} {videos.length === 1 ? "RECORDING" : "RECORDINGS"}
            </span>
          )}
        </div>

        {/* ── Main ── */}
        <div className="av-main">
          <div className="panel">

            {/* Panel header */}
            <div className="panel-header">
              <div className="panel-header-meta">
                <span className="panel-header-sup">STORAGE / RECORDINGS</span>
                <span className="panel-header-title">All Videos</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                {loading && (
                  <span className="panel-header-badge" style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", color: "#fb923c" }}>
                    LOADING
                  </span>
                )}
                {error && (
                  <span className="panel-header-badge" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
                    ERROR
                  </span>
                )}
                {data?.success && (
                  <span className="panel-header-badge" style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "#4ade80" }}>
                    {videos.length} FOUND
                  </span>
                )}
                {data && !data.success && (
                  <span className="panel-header-badge" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "#f87171" }}>
                    FAILED
                  </span>
                )}
              </div>
            </div>

            {/* Column header */}
            {!loading && !error && data?.success && videos.length > 0 && (
              <div className="col-header">
                <span className="col-header-text" style={{ minWidth: "22px" }}>#</span>
                <span className="col-header-text" style={{ marginLeft: "18px" }}>NAME</span>
                <span className="col-header-text" style={{ marginLeft: "auto" }}>OPEN</span>
              </div>
            )}

            {/* ── Loading skeleton ── */}
            {loading && (
              <div className="video-list">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div className="skeleton-row" key={i} style={{ opacity: 1 - i * 0.15 }}>
                    <div className="skeleton-bar" style={{ width: "22px" }} />
                    <div className="skeleton-bar" style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 }} />
                    <div className="skeleton-bar" style={{ flex: 1, maxWidth: `${180 + i * 30}px` }} />
                    <div className="skeleton-bar" style={{ width: "50px" }} />
                    <div className="skeleton-bar" style={{ width: "10px" }} />
                  </div>
                ))}
              </div>
            )}

            {/* ── Error state ── */}
            {!loading && error && (
              <div className="state-box">
                <span className="state-icon">⚠</span>
                <span className="state-title">Request Failed</span>
                <span className="state-msg">{error.message}</span>
                <button className="state-retry-btn" onClick={() => hitApi()}>↺ RETRY</button>
              </div>
            )}

            {/* ── API-level error ── */}
            {!loading && data && !data.success && (
              <div className="state-box">
                <span className="state-icon" style={{ color: "#f87171" }}>✕</span>
                <span className="state-title">Could Not Load Videos</span>
                <span className="state-msg">{(data as { success: false; message: string }).message}</span>
                <button className="state-retry-btn" onClick={() => hitApi()}>↺ RETRY</button>
              </div>
            )}

            {/* ── Empty state ── */}
            {!loading && data?.success && videos.length === 0 && (
              <div className="state-box">
                <span className="state-icon" style={{ color: "#2d3748" }}>▷</span>
                <span className="state-title empty">No Recordings Yet</span>
                <span className="state-msg">Start the browser and record a session to see videos here.</span>
              </div>
            )}

            {/* ── Video list ── */}
            {!loading && data?.success && videos.length > 0 && (
              <div className="video-list">
                {videos.map((e, i) => (
                  <Link
                    key={e.name}
                    to={`/video-details/${e.name}`}
                    className="video-row"
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className="row-index">{String(i + 1).padStart(2, "0")}</span>
                    <span className="row-dot" />
                    <span className="row-name">{e.name}</span>
                    <span className="row-badge">MP4</span>
                    <span className="row-arrow">→</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Panel footer */}
            <div className="panel-footer">
              <Link to="/" className="footer-back-link">
                ← HOME
              </Link>
              <span className="footer-right">
                {data?.success ? `${videos.length} item${videos.length !== 1 ? "s" : ""}` : "—"}
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}