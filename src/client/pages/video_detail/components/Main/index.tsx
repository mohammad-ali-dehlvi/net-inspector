import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useVideoDetailContext } from "src/client/context/videoDetail";
import {
  clamp, formatSeconds, formatTime,
  getMethodColor, inRange, isActive, itemMatchesQuery
} from "src/client/pages/video_detail/utils/helper";
import { SEEK_SECONDS, SPEED_OPTIONS, ALL_METHODS } from "src/client/pages/video_detail/utils/constants";
import KbdPill    from "src/client/pages/video_detail/components/KeyBoardHitPill";
import OSDToast   from "src/client/pages/video_detail/components/OSDToast";
import VolumeIcon from "src/client/pages/video_detail/components/VolumeIcon";
import RangeSlider from "src/client/pages/video_detail/components/RangeSlider";
import NetworkRow  from "src/client/pages/video_detail/components/NetworkRow";
import DetailPanel from "src/client/pages/video_detail/components/DetailPanel";
import FilterToolbar from "src/client/pages/video_detail/components/FilterToolbar";
import "src/client/pages/video_detail/components/Main/index.css";
import { NetworkItemType } from "src/shared/types";
import FloatingDetailPanel from "../DetailPanel/FloatingDetailPanel";
import { Link } from "react-router";


// ─── Main Component ───────────────────────────────────────────────────────────
export default function NetworkVideoPlayer() {
  const { videoDetails } = useVideoDetailContext();
  const videoRef = useRef<HTMLVideoElement>(null);
  const osdTimer = useRef<NodeJS.Timeout>(undefined);

  const [currentTime,    setCurrentTime]    = useState(0);
  const [duration,       setDuration]       = useState(0);
  const [selectedIndex,  setSelectedIndex]  = useState<number | null>(null);
  const [isPlaying,      setIsPlaying]      = useState(false);
  const [activeCount,    setActiveCount]    = useState(0);
  const [volume,         setVolume]         = useState(1);
  const [muted,          setMuted]          = useState(false);
  const [playbackRate,   setPlaybackRate]   = useState(1);
  const [showSpeedMenu,  setShowSpeedMenu]  = useState(false);
  const [osdMsg,         setOsdMsg]         = useState("");

  // ── Range ─────────────────────────────────────────────────────────────────
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd,   setRangeEnd]   = useState(0);

  // ── Filter & search state ─────────────────────────────────────────────────
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(new Set());
  const [searchQuery,     setSearchQuery]     = useState("");

  // ── Data ──────────────────────────────────────────────────────────────────
  const { video, network } = useMemo(() => {
    const video   = videoDetails?.success ? videoDetails.data.video : undefined;
    const network: NetworkItemType[] = (videoDetails?.success
      ? videoDetails?.data?.network?.requests
      : null) || [];
    return { video, network };
  }, [videoDetails]);

  const effectiveEnd = rangeEnd > 0 ? rangeEnd : duration;

  // ── Methods available in current data ─────────────────────────────────────
  const availableMethods = useMemo(() => {
    const seen = new Set<string>();
    network.forEach(n => seen.add(n.method.toUpperCase()));
    // Preserve canonical order
    return ALL_METHODS.filter(m => seen.has(m));
  }, [network]);

  const toggleMethod = useCallback((m: string) => {
    setSelectedMethods(prev => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }, []);

  // ── OSD ──────────────────────────────────────────────────────────────────
  const showOSD = useCallback((msg: string) => {
    setOsdMsg(msg);
    clearTimeout(osdTimer.current);
    osdTimer.current = setTimeout(() => setOsdMsg(""), 1100);
  }, []);

  // ── Seek ──────────────────────────────────────────────────────────────────
  const seekTo = useCallback((t: number) => {
    if (!videoRef.current) return;
    const lo   = rangeStart;
    const hi   = effectiveEnd || videoRef.current.duration || 0;
    const safe = clamp(t, lo, hi);
    videoRef.current.currentTime = safe;
    setCurrentTime(safe);
  }, [rangeStart, effectiveEnd]);

  // ── Range change ──────────────────────────────────────────────────────────
  const handleRangeChange = useCallback((newStart: number, newEnd: number) => {
    setRangeStart(newStart);
    setRangeEnd(newEnd);
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
    if (!videoRef.current || effectiveEnd === 0) return;
    if (currentTime >= effectiveEnd && isPlaying) {
      videoRef.current.pause();
      videoRef.current.currentTime = rangeStart;
      setCurrentTime(rangeStart);
    }
  }, [currentTime, effectiveEnd, rangeStart, isPlaying]);

  // ── Play/pause ────────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      if (videoRef.current.currentTime >= effectiveEnd)
        videoRef.current.currentTime = rangeStart;
      videoRef.current.play();
      showOSD("▶ Play");
    } else {
      videoRef.current.pause();
      showOSD("⏸ Pause");
    }
  }, [showOSD, effectiveEnd, rangeStart]);

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
    videoRef.current.muted  = safe === 0;
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
        case "ArrowLeft":  e.preventDefault();
          if (videoRef.current) { seekTo(videoRef.current.currentTime - SEEK_SECONDS); showOSD(`⏪ −${SEEK_SECONDS}s`); } break;
        case "ArrowUp":    e.preventDefault();
          if (videoRef.current) changeVolume(videoRef.current.volume + 0.1); break;
        case "ArrowDown":  e.preventDefault();
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
  // 1. Range filter
  const rangeFiltered = useMemo(
    () => network.filter(item => inRange(item, rangeStart, effectiveEnd)),
    [network, rangeStart, effectiveEnd],
  );

  // 2. Method filter (empty selectedMethods = show all)
  const methodFiltered = useMemo(
    () => selectedMethods.size === 0
      ? rangeFiltered
      : rangeFiltered.filter(item => selectedMethods.has(item.method.toUpperCase())),
    [rangeFiltered, selectedMethods],
  );

  // 3. Search filter
  const displayedNetwork = useMemo(
    () => methodFiltered.filter(item => itemMatchesQuery(item, searchQuery)),
    [methodFiltered, searchQuery],
  );

  const isFiltered   = displayedNetwork.length < network.length;
  const anyFilter    = selectedMethods.size > 0 || searchQuery.trim() !== "";

  const scrubPct = effectiveEnd > 0
    ? ((currentTime - rangeStart) / (effectiveEnd - rangeStart)) * 100
    : 0;
  const volPct = (muted ? 0 : volume) * 100;

  return (
    <div
      tabIndex={-1}
      style={{
        minHeight: "100vh", background: "#0b0d11",
        display: "flex", flexDirection: "column",
        fontFamily: "'JetBrains Mono',monospace",
        color: "#e2e8f0", outline: "none",
      }}
    >
      <FloatingDetailPanel item={typeof selectedIndex === "number" ? network[selectedIndex] : null} index={selectedIndex} onClose={()=>setSelectedIndex(null)} />
      {/* ── Top Bar ── */}
      <div style={{ borderBottom: "1px solid #141820", padding: "0 18px", height: "44px", display: "flex", alignItems: "center", gap: "14px", background: "#0d0f14", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }} />
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", fontWeight: 800, letterSpacing: "0.12em" }}>NET INSPECTOR</span>
        </div>
        <div style={{ height: "14px", width: "1px", background: "#1e2433" }} />
        <span style={{ fontSize: "9px", color: "#3d4451", letterSpacing: "0.06em" }}>
          {isFiltered
            ? <span style={{ color: "#fb923c" }}>{displayedNetwork.length}<span style={{ color: "#3d4451" }}>/{network.length} REQUESTS</span></span>
            : <span>{network.length} REQUESTS</span>
          }
        </span>
        {activeCount > 0 && (
          <span style={{ fontSize: "9px", color: "#4ade80", letterSpacing: "0.06em", animation: "fadeIn .2s ease" }}>
            ● {activeCount} ACTIVE
          </span>
        )}
        <Link to="/videos" className="footer-back-link">
                ← ALL VIDEOS
              </Link>
        <div style={{ marginLeft: "auto", display: "flex", gap: "12px", alignItems: "center" }}>
          <KbdPill keys={["Space"]} label="play" />
          <KbdPill keys={["←", "→"]} label={`${SEEK_SECONDS}s`} />
          <KbdPill keys={["↑", "↓"]} label="vol" />
          <KbdPill keys={["<", ">"]} label="speed" />
          <KbdPill keys={["M"]} label="mute" />
          <div style={{ width: "1px", height: "14px", background: "#1e2433" }} />
          <span style={{ fontSize: "10px", color: "#4a5568", fontFamily: "'JetBrains Mono',monospace" }}>
            {formatTime(currentTime)} / {effectiveEnd > 0 ? formatTime(effectiveEnd) : "--"}
          </span>
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "row", alignItems: "stretch", overflow: "hidden" }}>

        {/* ══ LEFT: Video + Controls ══ */}
        <div style={{ flex: 1, flexShrink: 0, borderRight: "1px solid #141820", display: "flex", flexDirection: "column" }}>

          {/* Video */}
          <div style={{ background: "#000", position: "relative", aspectRatio: "16/9", flexShrink: 0, overflow: "hidden" }}>
            <video
              ref={videoRef}
              src={video?.url}
              style={{ width: "100%", height: "100%", display: "block" }}
              onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
              onLoadedMetadata={e => {
                const d = e.currentTarget.duration;
                setDuration(d);
                setRangeStart(0);
                setRangeEnd(d);
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
            />
            <OSDToast message={osdMsg} />
            {duration > 0 && rangeStart > 0 && (
              <div style={{ position: "absolute", top: 0, left: 0, width: `${(rangeStart / duration) * 100}%`, bottom: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none", borderRight: "2px solid #60a5fa44" }} />
            )}
            {duration > 0 && effectiveEnd < duration && (
              <div style={{ position: "absolute", top: 0, left: `${(effectiveEnd / duration) * 100}%`, right: 0, bottom: 0, background: "rgba(0,0,0,0.55)", pointerEvents: "none", borderLeft: "2px solid #fb923c44" }} />
            )}
            {!isPlaying && (
              <div onClick={togglePlay} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
                  <span style={{ fontSize: "17px", marginLeft: "3px" }}>▶</span>
                </div>
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div style={{ padding: "10px 14px 8px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ position: "relative" }}>
              <input
                type="range" min={rangeStart} max={effectiveEnd || 100} step={0.01} value={currentTime}
                className="scrub-thumb"
                onChange={e => seekTo(parseFloat(e.target.value))}
                style={{ height: "3px", background: `linear-gradient(to right,#4ade80 ${scrubPct}%,#1e2433 0%)`, borderRadius: "2px" }}
              />
            </div>
            {duration > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "-4px" }}>
                <span style={{ fontSize: "8px", color: "#60a5fa88", fontFamily: "'JetBrains Mono',monospace" }}>{formatSeconds(rangeStart)}</span>
                <span style={{ fontSize: "8px", color: "#fb923c88", fontFamily: "'JetBrains Mono',monospace" }}>{formatSeconds(effectiveEnd)}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
              <button className="ctrl-btn" onClick={togglePlay} style={{ color: "#a0aec0", padding: "5px 7px", fontSize: "13px" }}>
                {isPlaying ? "⏸" : "▶"}
              </button>
              <button className="ctrl-btn" onClick={() => { seekTo((videoRef.current?.currentTime ?? rangeStart) - SEEK_SECONDS); showOSD(`⏪ −${SEEK_SECONDS}s`); }} style={{ color: "#4a5568", padding: "5px 6px", fontSize: "9px", fontFamily: "'JetBrains Mono',monospace" }}>
                −{SEEK_SECONDS}s
              </button>
              <button className="ctrl-btn" onClick={() => { seekTo((videoRef.current?.currentTime ?? rangeStart) + SEEK_SECONDS); showOSD(`⏩ +${SEEK_SECONDS}s`); }} style={{ color: "#4a5568", padding: "5px 6px", fontSize: "9px", fontFamily: "'JetBrains Mono',monospace" }}>
                +{SEEK_SECONDS}s
              </button>
              <div style={{ width: "1px", height: "16px", background: "#1e2433", margin: "0 4px" }} />
              <button className="ctrl-btn" onClick={toggleMute} style={{ color: muted || volume === 0 ? "#f87171" : "#60a5fa", padding: "5px 6px" }}>
                <VolumeIcon volume={volume} muted={muted} />
              </button>
              <input type="range" min={0} max={1} step={0.02} value={muted ? 0 : volume} className="vol-thumb"
                onChange={e => changeVolume(parseFloat(e.target.value))}
                style={{ width: "68px", height: "3px", background: `linear-gradient(to right,#60a5fa ${volPct}%,#1e2433 0%)`, borderRadius: "2px" }} />
              <span style={{ fontSize: "9px", color: "#3d4451", minWidth: "28px", fontFamily: "'JetBrains Mono',monospace" }}>{Math.round(volPct)}%</span>
              <div style={{ flex: 1 }} />
              <div style={{ position: "relative" }}>
                <button className="ctrl-btn" onClick={e => { e.stopPropagation(); setShowSpeedMenu(v => !v); }}
                  style={{ padding: "4px 9px", fontSize: "10px", fontWeight: "700", letterSpacing: "0.04em", fontFamily: "'JetBrains Mono',monospace", color: playbackRate !== 1 ? "#4ade80" : "#718096", background: playbackRate !== 1 ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${playbackRate !== 1 ? "#4ade8040" : "#1e2433"}`, borderRadius: "4px" }}>
                  {playbackRate}×
                </button>
                {showSpeedMenu && (
                  <div onClick={e => e.stopPropagation()} style={{ position: "absolute", bottom: "calc(100% + 6px)", right: 0, background: "#0d0f14", border: "1px solid #1e2433", borderRadius: "6px", overflow: "hidden", boxShadow: "0 10px 28px rgba(0,0,0,.6)", zIndex: 100, minWidth: "110px", animation: "slideDown .15s ease" }}>
                    <div style={{ padding: "6px 14px 4px", fontSize: "8px", color: "#3d4451", letterSpacing: "0.1em", borderBottom: "1px solid #141820" }}>PLAYBACK SPEED</div>
                    {SPEED_OPTIONS.map(rate => (
                      <button key={rate} className="speed-item" onClick={() => changeRate(rate)} style={{ color: playbackRate === rate ? "#4ade80" : "#718096", fontWeight: playbackRate === rate ? "700" : "400" }}>
                        {rate}×{rate === 1 ? " (normal)" : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Range Slider */}
          {duration > 0 && (
            <div style={{ borderTop: "1px solid #141820", paddingTop: "12px" }}>
              <RangeSlider
                min={0} max={duration}
                start={rangeStart} end={effectiveEnd}
                onChange={handleRangeChange}
                duration={duration}
              />
            </div>
          )}

          {/* Timeline Minimap */}
          <div style={{ padding: "2px 14px 12px", flexShrink: 0 }}>
            <div style={{ fontSize: "9px", color: "#3d4451", letterSpacing: "0.08em", marginBottom: "5px" }}>TIMELINE — click to seek</div>
            <div
              style={{ position: "relative", height: "32px", background: "#0d0f14", borderRadius: "4px", overflow: "hidden", cursor: "pointer" }}
              onClick={e => {
                const r   = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - r.left) / r.width;
                seekTo(pct * duration);
              }}
            >
              {duration > 0 && rangeStart > 0 && (
                <div style={{ position: "absolute", left: 0, width: `${(rangeStart / duration) * 100}%`, top: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1, pointerEvents: "none" }} />
              )}
              {duration > 0 && effectiveEnd < duration && (
                <div style={{ position: "absolute", left: `${(effectiveEnd / duration) * 100}%`, right: 0, top: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1, pointerEvents: "none" }} />
              )}
              {duration > 0 && (
                <>
                  <div style={{ position: "absolute", left: `${(rangeStart / duration) * 100}%`, top: 0, bottom: 0, width: "1px", background: "#60a5fa", opacity: 0.5, zIndex: 2, pointerEvents: "none" }} />
                  <div style={{ position: "absolute", left: `${(effectiveEnd / duration) * 100}%`, top: 0, bottom: 0, width: "1px", background: "#fb923c", opacity: 0.5, zIndex: 2, pointerEvents: "none" }} />
                </>
              )}
              {duration > 0 && network.map((item, i) => {
                const color  = getMethodColor(item.method as any);
                const active = isActive(item, currentTime);
                const inside = inRange(item, rangeStart, effectiveEnd);
                // Dim further if filtered out by method/search
                const inDisplay = displayedNetwork.includes(item);
                return (
                  <div key={i} title={item.url} style={{ position: "absolute", left: `${(item.start_seconds / duration) * 100}%`, width: `${Math.max(((item.end_seconds - item.start_seconds) / duration) * 100, 0.4)}%`, top: `${(i % 4) * 7 + 4}px`, height: "5px", background: color, opacity: active ? 1 : inside && inDisplay ? 0.35 : 0.07, borderRadius: "2px", minWidth: "3px", boxShadow: active ? `0 0 6px ${color}` : "none", transition: "opacity .2s" }} />
                );
              })}
              {duration > 0 && (
                <div style={{ position: "absolute", left: `${(currentTime / duration) * 100}%`, top: 0, bottom: 0, width: "1px", background: "#e2e8f0", opacity: 0.85, boxShadow: "0 0 4px #fff", pointerEvents: "none", zIndex: 3 }} />
              )}
            </div>
          </div>

          {/* Stats */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid #141820", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            {["GET", "POST", "OTHER"].map(type => {
              const all  = type === "OTHER"
                ? network.filter(n => n.method !== "GET" && n.method !== "POST")
                : network.filter(n => n.method === type);
              const vis  = all.filter(item => displayedNetwork.includes(item));
              const color = getMethodColor((type === "OTHER" ? "OPTIONS" : type) as any);
              return (
                <div key={type} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "16px", fontWeight: "700", color }}>
                    {anyFilter
                      ? <span>{vis.length}<span style={{ fontSize: "9px", color: "#2d3748" }}>/{all.length}</span></span>
                      : all.length}
                  </div>
                  <div style={{ fontSize: "9px", color: "#3d4451", letterSpacing: "0.06em" }}>{type}</div>
                </div>
              );
            })}
          </div>

          {/* Detail Panel */}
          {/* <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid #141820", fontSize: "9px", color: "#3d4451", letterSpacing: "0.1em", flexShrink: 0, background: "#0d0f14" }}>
              {selectedIndex !== null ? `REQUEST #${String(selectedIndex + 1).padStart(2, "0")}` : "SELECT A REQUEST"}
            </div>
            <DetailPanel item={selectedIndex !== null ? network[selectedIndex] : null} />
          </div> */}
        </div>

        {/* ══ CENTER: Network List ══ */}
        <div style={{ flex: 1, flexShrink: 0, borderRight: "1px solid #141820", display: "flex", flexDirection: "column", position: "relative", overflow: "hidden" }}>

          {/* ── Filter Toolbar ── */}
          <FilterToolbar
            availableMethods={availableMethods}
            selectedMethods={selectedMethods}
            onToggleMethod={toggleMethod}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            totalCount={rangeFiltered.length}
            visibleCount={displayedNetwork.length}
          />

          {/* ── List header ── */}
          <div style={{ padding: "8px 14px", borderBottom: "1px solid #141820", fontSize: "9px", color: "#3d4451", letterSpacing: "0.1em", display: "flex", gap: "8px", alignItems: "center", flexShrink: 0, background: "#0d0f14" }}>
            <span>URL — click to seek + inspect</span>
            <span style={{ marginLeft: "auto", flexShrink: 0 }}>START → END</span>
          </div>

          {/* ── Scrollable rows ── */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflowY: "scroll", display: "flex", flexDirection: "column" }}>
            {/* Spacer for the two sticky headers above */}
            <div style={{ flexShrink: 0 }}>
              <FilterToolbar
                availableMethods={availableMethods}
                selectedMethods={selectedMethods}
                onToggleMethod={toggleMethod}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                totalCount={rangeFiltered.length}
                visibleCount={displayedNetwork.length}
              />
              <div style={{ padding: "8px 14px", borderBottom: "1px solid #141820", fontSize: "9px", color: "#3d4451", letterSpacing: "0.1em", display: "flex", gap: "8px", alignItems: "center", background: "#0d0f14" }}>
                <span>URL — click to seek + inspect</span>
                <span style={{ marginLeft: "auto", flexShrink: 0 }}>START → END</span>
              </div>
            </div>

            {displayedNetwork.length === 0 ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "10px", color: "#2d3748" }}>
                <span style={{ fontSize: "20px" }}>
                  {searchQuery ? "🔍" : "⏱"}
                </span>
                <span style={{ fontSize: "11px", fontFamily: "'JetBrains Mono',monospace" }}>
                  {searchQuery
                    ? "no results"
                    : selectedMethods.size > 0
                    ? "no matching methods"
                    : "no requests in range"}
                </span>
                <span style={{ fontSize: "9px", color: "#1e2433" }}>
                  {searchQuery
                    ? `"${searchQuery}"`
                    : `${formatSeconds(rangeStart)} → ${formatSeconds(effectiveEnd)}`}
                </span>
                {(searchQuery || selectedMethods.size > 0) && (
                  <button
                    onClick={() => { setSearchQuery(""); setSelectedMethods(new Set()); }}
                    style={{ marginTop: "4px", background: "rgba(255,255,255,0.04)", border: "1px solid #1e2433", borderRadius: "4px", color: "#4a5568", fontSize: "9px", fontFamily: "'JetBrains Mono',monospace", padding: "4px 12px", cursor: "pointer", letterSpacing: "0.06em", transition: "all .15s" }}
                  >
                    clear filters
                  </button>
                )}
              </div>
            ) : (
              displayedNetwork.map((item) => {
                const globalIndex = network.indexOf(item);
                return (
                  <NetworkRow
                    key={globalIndex}
                    item={item}
                    index={globalIndex}
                    isHighlighted={isActive(item, currentTime)}
                    duration={duration}
                    onSelect={setSelectedIndex}
                    onSeek={seekTo}
                    isSelected={selectedIndex === globalIndex}
                    rangeStart={rangeStart}
                    rangeEnd={effectiveEnd}
                  />
                );
              })
            )}
          </div>

        </div>

      </div>
    </div>
  );
}