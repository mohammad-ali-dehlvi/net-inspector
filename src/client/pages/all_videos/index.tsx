import { useEffect } from "react";
import { Link } from "react-router";
import useApiHook from "src/client/hooks/useApiHook";
import { videoService } from "src/client/services";
import cssStyles from "src/client/pages/all_videos/style.module.css";
import Header from "src/client/components/Header";

export default function AllVideos() {
  const { data, loading, error, hitApi } = useApiHook({ callback: videoService.getNameList });

  useEffect(() => {
    hitApi();
  }, []);

  const videos = data?.success ? data.data.names : [];

  return (
    <>
      <div className={cssStyles.av_root}>
        {/* ── Top Bar ── */}
        <Header
          leftComponent={(
            <div className={cssStyles['topbar-crumb']}>
              <Link to="/" style={{ color: "var(--text-darker)", textDecoration: "none", letterSpacing: "0.06em" }}>HOME</Link>
              <span className={cssStyles['topbar-crumb-sep']}>/</span>
              <span className={cssStyles['topbar-crumb-active']}>VIDEOS</span>
            </div>
          )}
          rightComponent={(
            <>
              {data?.success && (
                <span className={cssStyles['topbar-count']} style={{ animation: "fadeIn .2s ease" }}>
                  {videos.length} {videos.length === 1 ? "RECORDING" : "RECORDINGS"}
                </span>
              )}
            </>
          )}
        />

        {/* ── Main ── */}
        <div className={cssStyles['av-main']}>
          <div className={cssStyles.panel}>

            {/* Panel header */}
            <div className={cssStyles['panel-header']}>
              <div className={cssStyles['panel-header-meta']}>
                <span className={cssStyles['panel-header-sup']}>STORAGE / RECORDINGS</span>
                <span className={cssStyles['panel-header-title']}>All Videos</span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                {loading && (
                  <span className={cssStyles['panel-header-badge']} style={{ background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", color: "var(--theme-warning)" }}>
                    LOADING
                  </span>
                )}
                {error && (
                  <span className={cssStyles['panel-header-badge']} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--theme-error)" }}>
                    ERROR
                  </span>
                )}
                {data?.success && (
                  <span className={cssStyles['panel-header-badge']} style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: "var(--theme-success)" }}>
                    {videos.length} FOUND
                  </span>
                )}
                {data && !data.success && (
                  <span className={cssStyles['panel-header-badge']} style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", color: "var(--theme-error)" }}>
                    FAILED
                  </span>
                )}
              </div>
            </div>

            {/* Column header */}
            {!loading && !error && data?.success && videos.length > 0 && (
              <div className={cssStyles['col-header']}>
                <span className={cssStyles['col-header-text']} style={{ minWidth: "22px" }}>#</span>
                <span className={cssStyles['col-header-text']} style={{ marginLeft: "18px" }}>NAME</span>
                <span className={cssStyles['col-header-text']} style={{ marginLeft: "auto" }}>OPEN</span>
              </div>
            )}

            {/* ── Loading skeleton ── */}
            {loading && (
              <div className={cssStyles['video-list']}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div className={cssStyles['skeleton-row']} key={i} style={{ opacity: 1 - i * 0.15 }}>
                    <div className={cssStyles['skeleton-bar']} style={{ width: "22px" }} />
                    <div className={cssStyles['skeleton-bar']} style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 }} />
                    <div className={cssStyles['skeleton-bar']} style={{ flex: 1, maxWidth: `${180 + i * 30}px` }} />
                    <div className={cssStyles['skeleton-bar']} style={{ width: "50px" }} />
                    <div className={cssStyles['skeleton-bar']} style={{ width: "10px" }} />
                  </div>
                ))}
              </div>
            )}

            {/* ── Error state ── */}
            {!loading && error && (
              <div className={cssStyles['state-box']}>
                <span className={cssStyles['state-icon']}>⚠</span>
                <span className={cssStyles['state-title']}>Request Failed</span>
                <span className={cssStyles['state-msg']}>{error.message}</span>
                <button className={cssStyles['state-retry-btn']} onClick={() => hitApi()}>↺ RETRY</button>
              </div>
            )}

            {/* ── API-level error ── */}
            {!loading && data && !data.success && (
              <div className={cssStyles['state-box']}>
                <span className={cssStyles['state-icon']} style={{ color: "var(--theme-error)" }}>✕</span>
                <span className={cssStyles['state-title']}>Could Not Load Videos</span>
                <span className={cssStyles['state-msg']}>{(data as { success: false; message: string }).message}</span>
                <button className={cssStyles['state-retry-btn']} onClick={() => hitApi()}>↺ RETRY</button>
              </div>
            )}

            {/* ── Empty state ── */}
            {!loading && data?.success && videos.length === 0 && (
              <div className={cssStyles['state-box']}>
                <span className={cssStyles['state-icon']} style={{ color: "var(--text-darker)" }}>▷</span>
                <span className={`${cssStyles['state-title']} ${cssStyles.empty}`}>No Recordings Yet</span>
                <span className={cssStyles['state-msg']}>Start the browser and record a session to see videos here.</span>
              </div>
            )}

            {/* ── Video list ── */}
            {!loading && data?.success && videos.length > 0 && (
              <div className={cssStyles['video-list']}>
                {videos.map((e, i) => (
                  <Link
                    key={e.name}
                    to={`/video-details/${e.name}`}
                    className={cssStyles['video-row']}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <span className={cssStyles['row-index']}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={cssStyles['row-dot']} />
                    <span className={cssStyles['row-name']}>{e.name}</span>
                    <span className={cssStyles['row-badge']}>MP4</span>
                    <span className={cssStyles['row-arrow']}>→</span>
                  </Link>
                ))}
              </div>
            )}

            {/* Panel footer */}
            <div className={cssStyles['panel-footer']}>
              <Link to="/" className={cssStyles['footer-back-link']}>
                ← HOME
              </Link>
              <span className={cssStyles['footer-right']}>
                {data?.success ? `${videos.length} item${videos.length !== 1 ? "s" : ""}` : "—"}
              </span>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}