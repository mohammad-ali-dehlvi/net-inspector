
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";
import {
  clamp, formatSeconds, formatTime,
  getMethodColor, inRange, isActive
} from "src/client/pages/video_detail/utils/helper";
import { SEEK_SECONDS, SPEED_OPTIONS, ALL_METHODS } from "src/client/pages/video_detail/utils/constants";

import OSDToast from "src/client/pages/video_detail/components/OSDToast";
import VolumeIcon from "src/client/pages/video_detail/components/VolumeIcon";
import RangeSlider from "src/client/pages/video_detail/components/RangeSlider";
import NetworkRow from "src/client/pages/video_detail/components/NetworkRow";
import FilterToolbar from "src/client/pages/video_detail/components/FilterToolbar";
// import FloatingDetailPanel from "../DetailPanel/FloatingDetailPanel";
import { Link } from "react-router";
import { useVideoDetailPlayerContext } from "src/client/pages/video_detail/context/VideoDetailPlayerContext";

// Import CSS Module
import cssStyles from "src/client/pages/video_detail/components/Main/style.module.css";

import Header from "src/client/components/Header";

export default function NetworkVideoPlayer() {
  const { video, requests: network = [] } = useVideoDetailContext();
  const {
    duration,
    setDuration,
    range,
    setRange,
    searchQueries,
    setSearchQueries,
    displayedNetwork,
    selectedTags,
    setSelectedTags,
  } = useVideoDetailPlayerContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const osdTimer = useRef<NodeJS.Timeout>(undefined);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [osdMsg, setOsdMsg] = useState("");

  const { start: rangeStart, end: rangeEnd } = range

  // ── OSD ──────────────────────────────────────────────────────────────────
  const showOSD = useCallback((msg: string) => {
    setOsdMsg(msg);
    clearTimeout(osdTimer.current);
    osdTimer.current = setTimeout(() => setOsdMsg(""), 1100);
  }, []);

  // ── Seek ──────────────────────────────────────────────────────────────────
  const seekTo = useCallback((t: number) => {
    if (!videoRef.current) return;
    const lo = rangeStart;
    const hi = rangeEnd || videoRef.current.duration || 0;
    const safe = clamp(t, lo, hi);
    videoRef.current.currentTime = safe;
    setCurrentTime(safe);
  }, [rangeStart, rangeEnd]);

  // ── Range change ──────────────────────────────────────────────────────────
  const handleRangeChange = useCallback((newStart: number, newEnd: number) => {
    if (videoRef.current) {
      if (videoRef.current.currentTime < newStart) {
        videoRef.current.currentTime = newStart;
        setCurrentTime(newStart);
      } else if (videoRef.current.currentTime > newEnd) {
        videoRef.current.currentTime = newEnd;
        setCurrentTime(newEnd);
        videoRef.current.pause();
      }
    }
  }, []);

  // ── Loop within range ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current || rangeEnd === 0) return;
    if (currentTime >= rangeEnd && isPlaying) {
      videoRef.current.pause();
      videoRef.current.currentTime = rangeStart;
      setCurrentTime(rangeStart);
    }
  }, [currentTime, rangeEnd, rangeStart, isPlaying]);

  // ── Play/pause ────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      if (videoRef.current.currentTime >= rangeEnd)
        videoRef.current.currentTime = rangeStart;
      videoRef.current.play();
      showOSD("▶ Play");
    } else {
      videoRef.current.pause();
      showOSD("⏸ Pause");
    }
  }, [showOSD, rangeEnd, rangeStart]);

  // ── Rate ──────────────────────────────────────────────────────────────────
  const changeRate = useCallback((rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    showOSD(`${rate}×`);
  }, [showOSD]);

  // ── Volume ────────────────────────────────────────────────────────────────
  const changeVolume = useCallback((v: number) => {
    const safe = clamp(v, 0, 1);
    if (!videoRef.current) return;
    videoRef.current.volume = safe;
    videoRef.current.muted = safe === 0;
    setVolume(safe);
    setMuted(safe === 0);
    showOSD(`🔊 ${Math.round(safe * 100)}%`);
  }, [showOSD]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    const next = !muted;
    videoRef.current.muted = next;
    setMuted(next);
    showOSD(next ? "🔇 Muted" : `🔊 ${Math.round(volume * 100)}%`);
  }, [muted, volume, showOSD]);

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowRight": e.preventDefault();
          if (videoRef.current) { seekTo(videoRef.current.currentTime + SEEK_SECONDS); showOSD(`⏩ +${SEEK_SECONDS}s`); } break;
        case "ArrowLeft": e.preventDefault();
          if (videoRef.current) { seekTo(videoRef.current.currentTime - SEEK_SECONDS); showOSD(`⏪ −${SEEK_SECONDS}s`); } break;
        case "ArrowUp": e.preventDefault();
          if (videoRef.current) changeVolume(videoRef.current.volume + 0.1); break;
        case "ArrowDown": e.preventDefault();
          if (videoRef.current) changeVolume(videoRef.current.volume - 0.1); break;
        case "m": case "M": e.preventDefault(); toggleMute(); break;
        case ">": {
          e.preventDefault();
          const idx = SPEED_OPTIONS.indexOf(playbackRate);
          if (idx < SPEED_OPTIONS.length - 1) changeRate(SPEED_OPTIONS[idx + 1]); break;
        }
        case "<": {
          e.preventDefault();
          const idx = SPEED_OPTIONS.indexOf(playbackRate);
          if (idx > 0) changeRate(SPEED_OPTIONS[idx - 1]); break;
        }
        default: break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekTo, changeVolume, toggleMute, changeRate, playbackRate, showOSD]);

  // ── Speed menu close on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!showSpeedMenu) return;
    const close = () => setShowSpeedMenu(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [showSpeedMenu]);

  // ── Active count ──────────────────────────────────────────────────────────
  useEffect(() => {
    setActiveCount(network.filter(i => isActive(i, currentTime)).length);
  }, [currentTime, network]);

  // ── Filtering pipeline ────────────────────────────────────────────────────

  const anyFilter = selectedTags.size > 0 || searchQueries.some(e => e.trim() !== "");

  const scrubPct = rangeEnd > 0
    ? ((currentTime - rangeStart) / (rangeEnd - rangeStart)) * 100
    : 0;
  const volPct = (muted ? 0 : volume) * 100;

  return (
    <div className={cssStyles.container} tabIndex={-1}>
      {/* <FloatingDetailPanel /> */}

      {/* ── Main Layout ── */}
      <div className={cssStyles.mainLayout}>

        {/* ══ LEFT: Video + Controls ══ */}
        <div className={cssStyles.leftPanel}>
          <div className={cssStyles.videoWrapper}>
            <video
              ref={videoRef}
              src={video?.url}
              className={cssStyles.videoElement}
              onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
              onLoadedMetadata={e => {
                const d = e.currentTarget.duration;
                setDuration(d);
                setRange({ start: 0, end: d });
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
            />
            <OSDToast message={osdMsg} />
            {!isPlaying && (
              <div onClick={togglePlay} className={cssStyles.videoOverlay}>
                <div className={cssStyles.playButtonCircle}>
                  <span style={{ fontSize: "17px", marginLeft: "3px" }}>▶</span>
                </div>
              </div>
            )}
          </div>

          <div className={cssStyles.controlsContainer}>
            <div style={{ position: "relative" }}>
              <input
                type="range" min={rangeStart} max={rangeEnd || 100} step={0.01} value={currentTime}
                className={cssStyles.scrubRange}
                onChange={e => seekTo(parseFloat(e.target.value))}
                style={{ background: `linear-gradient(to right,var(--theme-success) ${scrubPct}%,#1e2433 0%)` }}
              />
            </div>
            <div className={cssStyles.ctrlBtnGroup} style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <button className={cssStyles.ctrlBtn} onClick={togglePlay}>
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button className={cssStyles.ctrlBtn} style={{ fontSize: '9px' }} onClick={() => seekTo(currentTime - SEEK_SECONDS)}>
                −{SEEK_SECONDS}s
              </button>
              <button className={cssStyles.ctrlBtn} style={{ fontSize: '9px' }} onClick={() => seekTo(currentTime + SEEK_SECONDS)}>
                +{SEEK_SECONDS}s
              </button>

              <div style={{ width: "1px", height: "16px", background: "#1e2433", margin: "0 4px" }} />

              <button className={cssStyles.ctrlBtn} onClick={toggleMute} style={{ color: muted || volume === 0 ? "var(--theme-error)" : "var(--theme-info)" }}>
                <VolumeIcon volume={volume} muted={muted} />
              </button>
              <input
                type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume}
                className={cssStyles.volumeRange}
                onChange={e => changeVolume(parseFloat(e.target.value))}
                style={{ background: `linear-gradient(to right,var(--theme-info) ${volPct}%,#1e2433 0%)` }}
              />
              <span style={{ fontSize: "9px", color: "var(--text-deep)", minWidth: "28px" }}>{Math.round(volPct)}%</span>

              <div style={{ flex: 1 }} />

              <div style={{ position: "relative" }}>
                <button
                  className={cssStyles.ctrlBtn}
                  onClick={e => { e.stopPropagation(); setShowSpeedMenu(!showSpeedMenu); }}
                  style={{ color: playbackRate !== 1 ? "var(--theme-success)" : "var(--text-dim)" }}
                >
                  {playbackRate}×
                </button>
                {showSpeedMenu && (
                  <div className={cssStyles.speedMenu} onClick={e => e.stopPropagation()}>
                    <div style={{ padding: "6px 14px 4px", fontSize: "8px", color: "var(--text-deep)", borderBottom: "1px solid #141820" }}>PLAYBACK SPEED</div>
                    {SPEED_OPTIONS.map(rate => (
                      <button
                        key={rate}
                        className={cssStyles.speedItem}
                        onClick={() => changeRate(rate)}
                        style={{ color: playbackRate === rate ? "var(--theme-success)" : "var(--text-dim)" }}
                      >
                        {rate}×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #141820", paddingTop: "12px" }}>
            <RangeSlider onChange={handleRangeChange} />
          </div>

          <div style={{ padding: "10px 14px", borderTop: "1px solid #141820", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {["GET", "POST", "OTHER"].map(type => {
              const all = type === "OTHER"
                ? network.filter(n => n.request.method !== "GET" && n.request.method !== "POST")
                : network.filter(n => n.request.method === type);
              const vis = all.filter(item => displayedNetwork.includes(item));
              const color = getMethodColor((type === "OTHER" ? "OPTIONS" : type) as any);
              return (
                <div key={type} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "16px", fontWeight: "700", color }}>
                    {anyFilter
                      ? <span>{vis.length}<span style={{ fontSize: "9px", color: "var(--text-darker)" }}>/{all.length}</span></span>
                      : all.length}
                  </div>
                  <div style={{ fontSize: "9px", color: "var(--text-deep)", letterSpacing: "0.06em" }}>{type}</div>
                </div>
              );
            })}
          </div>

        </div>

        {/* ══ RIGHT: Network List ══ */}
        <div className={cssStyles.rightPanel}>
          <div className={cssStyles.scrollArea}>
            <div style={{ flexShrink: 0 }}>
              <FilterToolbar />
              <div className={cssStyles.listHeader}>
                <span>URL — click to seek + inspect</span>
                <span style={{ marginLeft: "auto", flexShrink: 0 }}>START → END</span>
              </div>
            </div>

            {displayedNetwork.map((item, index) => (
              <NetworkRow
                key={`${index}-${item.startSeconds}-${item.endSeconds}-${item.request.method}-${item.response.status}`}
                item={item}
                isHighlighted={isActive(item, currentTime)}
                onSeek={seekTo}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}