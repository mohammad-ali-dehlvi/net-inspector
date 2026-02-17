import { useCallback, useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { useVideoDetailContext } from "src/client/context/videoDetail";
import { clamp, formatSeconds, getMethodColor } from "src/client/pages/video_detail/utils/helper";

interface RangeSliderProps {
    min: number
    max: number
    start: number
    end: number
    duration: number
    onChange: (a: number, b: number) => void
}

export default function RangeSlider({ min, max, start, end, onChange, duration }: RangeSliderProps) {
    const { videoDetails } = useVideoDetailContext()
    const trackRef = useRef<HTMLDivElement | null>(null);
    const dragging = useRef<"start" | "end" | null>(null); // "start" | "end" | null

    const network = useMemo(() => {
        if (videoDetails && videoDetails.success) {
            return videoDetails?.data?.network?.requests || []
        }
        return []
    }, [videoDetails])

    const pct = (v: number) => ((v - min) / (max - min)) * 100;

    const valueFromEvent = useCallback((e: MouseEvent) => {
        if (!trackRef.current) return 0
        const rect = trackRef.current.getBoundingClientRect();
        const raw = (e.clientX - rect.left) / rect.width;
        return clamp(min + raw * (max - min), min, max);
    }, [min, max]);

    const onMouseDown = (handle: typeof dragging.current) => (e: ReactMouseEvent<HTMLDivElement, MouseEvent>) => {
        e.preventDefault();
        dragging.current = handle;
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!dragging.current) return;
        const v = valueFromEvent(e);
        if (dragging.current === "start") {
            onChange(clamp(v, min, end - 0.1), end);
        } else {
            onChange(start, clamp(v, start + 0.1, max));
        }
    }, [valueFromEvent, start, end, min, max, onChange]);

    const onMouseUp = useCallback(() => {
        dragging.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    }, [onMouseMove]);

    // touch support
    const onTouchStart = (handle: typeof dragging.current) => (e: ReactTouchEvent<HTMLDivElement>) => {
        dragging.current = handle;
        const move = (te: TouchEvent) => {
            if (!trackRef.current) return
            const t = te.touches[0];
            const rect = trackRef.current.getBoundingClientRect();
            const raw = (t.clientX - rect.left) / rect.width;
            const v = clamp(min + raw * (max - min), min, max);
            if (dragging.current === "start") onChange(clamp(v, min, end - 0.1), end);
            else onChange(start, clamp(v, start + 0.1, max));
        };
        const up = () => {
            dragging.current = null;
            window.removeEventListener("touchmove", move);
            window.removeEventListener("touchend", up);
        };
        window.addEventListener("touchmove", move, { passive: true });
        window.addEventListener("touchend", up);
    };

    const startPct = pct(start);
    const endPct = pct(end);
    const isFullRange = start === min && end === max;

    return (
        <div style={{ padding: "0 14px 14px", flexShrink: 0 }}>
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px", gap: "8px" }}>
                <span style={{ fontSize: "9px", color: "#3d4451", letterSpacing: "0.08em" }}>TIME RANGE FILTER</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>
                    {/* Start badge */}
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", padding: "2px 7px", borderRadius: "3px", background: "rgba(96,165,250,0.12)", border: "1px solid rgba(96,165,250,0.25)", color: "#60a5fa" }}>
                        {formatSeconds(start)}
                    </span>
                    <span style={{ color: "#2d3748", fontSize: "9px" }}>→</span>
                    {/* End badge */}
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", padding: "2px 7px", borderRadius: "3px", background: "rgba(251,146,60,0.12)", border: "1px solid rgba(251,146,60,0.25)", color: "#fb923c" }}>
                        {formatSeconds(end)}
                    </span>
                    {/* Reset button — only visible when not full range */}
                    {!isFullRange && (
                        <button
                            onClick={() => onChange(min, max)}
                            title="Reset to full range"
                            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid #1e2433", borderRadius: "3px", color: "#4a5568", cursor: "pointer", fontSize: "9px", fontFamily: "'JetBrains Mono',monospace", padding: "2px 7px", transition: "all .15s" }}
                        >
                            reset
                        </button>
                    )}
                </div>
            </div>

            {/* Track */}
            <div
                ref={trackRef}
                style={{ position: "relative", height: "20px", display: "flex", alignItems: "center", cursor: "default", userSelect: "none" }}
            >
                {/* Full track bg */}
                <div style={{ position: "absolute", left: 0, right: 0, height: "4px", background: "#141820", borderRadius: "2px" }} />

                {/* Dimmed left zone */}
                <div style={{ position: "absolute", left: 0, width: `${startPct}%`, height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "2px 0 0 2px" }} />

                {/* Active zone fill */}
                <div style={{
                    position: "absolute",
                    left: `${startPct}%`,
                    width: `${endPct - startPct}%`,
                    height: "4px",
                    background: isFullRange
                        ? "linear-gradient(to right, #60a5fa, #4ade80)"
                        : "linear-gradient(to right, #60a5fa, #fb923c)",
                    borderRadius: "1px",
                    boxShadow: isFullRange ? "0 0 6px rgba(96,165,250,0.3)" : "0 0 8px rgba(251,146,60,0.25)",
                    transition: "box-shadow .2s",
                }} />

                {/* Dimmed right zone */}
                <div style={{ position: "absolute", left: `${endPct}%`, right: 0, height: "4px", background: "rgba(255,255,255,0.04)", borderRadius: "0 2px 2px 0" }} />

                {/* Network item ticks inside track */}
                {duration > 0 && network.map((item, i) => {
                    const tickPct = ((item.start_seconds - min) / (max - min)) * 100;
                    if (tickPct < 0 || tickPct > 100) return null;
                    const inside = item.start_seconds >= start && item.start_seconds <= end;
                    return (
                        <div key={i} style={{ position: "absolute", left: `${tickPct}%`, top: "50%", transform: "translateY(-50%)", width: "2px", height: "8px", background: getMethodColor(item.method as any), opacity: inside ? 0.6 : 0.15, borderRadius: "1px", pointerEvents: "none" }} />
                    );
                })}

                {/* Start handle */}
                <div
                    onMouseDown={onMouseDown("start")}
                    onTouchStart={onTouchStart("start")}
                    style={{
                        position: "absolute",
                        left: `${startPct}%`,
                        transform: "translateX(-50%)",
                        width: "14px", height: "14px",
                        borderRadius: "50%",
                        background: "#60a5fa",
                        border: "2px solid #0b0d11",
                        boxShadow: "0 0 0 1px #60a5fa, 0 2px 8px rgba(0,0,0,0.5)",
                        cursor: "ew-resize",
                        zIndex: 3,
                        transition: "box-shadow .15s",
                    }}
                />

                {/* End handle */}
                <div
                    onMouseDown={onMouseDown("end")}
                    onTouchStart={onTouchStart("end")}
                    style={{
                        position: "absolute",
                        left: `${endPct}%`,
                        transform: "translateX(-50%)",
                        width: "14px", height: "14px",
                        borderRadius: "50%",
                        background: isFullRange ? "#4ade80" : "#fb923c",
                        border: "2px solid #0b0d11",
                        boxShadow: `0 0 0 1px ${isFullRange ? "#4ade80" : "#fb923c"}, 0 2px 8px rgba(0,0,0,0.5)`,
                        cursor: "ew-resize",
                        zIndex: 3,
                        transition: "background .2s, box-shadow .2s",
                    }}
                />
            </div>

            {/* Time axis ticks */}
            <div style={{ position: "relative", marginTop: "4px", height: "12px" }}>
                {duration > 0 && Array.from({ length: 5 }).map((_, i) => {
                    const t = min + (i / 4) * (max - min);
                    return (
                        <span key={i} style={{ position: "absolute", left: `${(i / 4) * 100}%`, transform: "translateX(-50%)", fontSize: "8px", color: "#2d3748", fontFamily: "'JetBrains Mono',monospace", whiteSpace: "nowrap" }}>
                            {formatSeconds(t)}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}