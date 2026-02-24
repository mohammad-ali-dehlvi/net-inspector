import { useCallback, useMemo, useRef } from "react";
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from "react";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";
import { clamp, formatSeconds, getMethodColor } from "src/client/pages/video_detail/utils/helper";
import { useVideoDetailPlayerContext } from "src/client/pages/video_detail/context/VideoDetailPlayerContext";
import cssStyles from "src/client/pages/video_detail/components/RangeSlider/style.module.css";

interface RangeSliderProps {
    onChange?: (a: number, b: number) => void
}

export default function RangeSlider({ onChange }: RangeSliderProps) {
    const { video, requests: network = [] } = useVideoDetailContext()
    const { duration, range, setRange } = useVideoDetailPlayerContext()
    const min = 0;
    const max = duration;
    const start = range.start;
    const end = range.end;
    const trackRef = useRef<HTMLDivElement | null>(null);
    const dragging = useRef<"start" | "end" | null>(null);

    const handleRangeChange = useCallback((start: number, end: number) => {
        setRange({ start, end });
        onChange?.(start, end);
    }, [onChange, setRange]);

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
            handleRangeChange(clamp(v, min, end - 0.1), end);
        } else {
            handleRangeChange(start, clamp(v, start + 0.1, max));
        }
    }, [valueFromEvent, start, end, min, max, handleRangeChange]);

    const onMouseUp = useCallback(() => {
        dragging.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
    }, [onMouseMove]);

    const onTouchStart = (handle: typeof dragging.current) => (e: ReactTouchEvent<HTMLDivElement>) => {
        dragging.current = handle;
        const move = (te: TouchEvent) => {
            if (!trackRef.current) return
            const t = te.touches[0];
            const rect = trackRef.current.getBoundingClientRect();
            const raw = (t.clientX - rect.left) / rect.width;
            const v = clamp(min + raw * (max - min), min, max);
            if (dragging.current === "start") handleRangeChange(clamp(v, min, end - 0.1), end);
            else handleRangeChange(start, clamp(v, start + 0.1, max));
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
        <div className={cssStyles.container}>
            <div className={cssStyles.headerRow}>
                <span className={cssStyles.title}>TIME RANGE FILTER</span>
                <div className={cssStyles.badgeContainer}>
                    <span className={`${cssStyles.badge} ${cssStyles.startBadge}`}>
                        {formatSeconds(start)}
                    </span>
                    <span className={cssStyles.arrow}>→</span>
                    <span className={`${cssStyles.badge} ${cssStyles.endBadge}`}>
                        {formatSeconds(end)}
                    </span>
                    {!isFullRange && (
                        <button
                            onClick={() => handleRangeChange(min, max)}
                            title="Reset to full range"
                            className={cssStyles.resetButton}
                        >
                            reset
                        </button>
                    )}
                </div>
            </div>

            <div ref={trackRef} className={cssStyles.trackWrapper}>
                <div className={cssStyles.trackBg} />

                {/* Left Dimmed */}
                <div className={cssStyles.dimmedZone} style={{ left: 0, width: `${startPct}%`, borderRadius: "2px 0 0 2px" }} />

                {/* Active Fill */}
                <div
                    className={cssStyles.activeZone}
                    style={{
                        left: `${startPct}%`,
                        width: `${endPct - startPct}%`,
                        background: isFullRange
                            ? "linear-gradient(to right, var(--theme-info), var(--theme-success))"
                            : "linear-gradient(to right, var(--theme-info), var(--theme-warning))",
                        boxShadow: isFullRange ? "0 0 6px rgba(96,165,250,0.3)" : "0 0 8px rgba(251,146,60,0.25)",
                    }}
                />

                {/* Right Dimmed */}
                <div className={cssStyles.dimmedZone} style={{ left: `${endPct}%`, right: 0, borderRadius: "0 2px 2px 0" }} />

                {duration > 0 && network.map((item, i) => {
                    const tickPct = ((item.startSeconds - min) / (max - min)) * 100;
                    if (tickPct < 0 || tickPct > 100) return null;
                    const inside = item.startSeconds >= start && item.startSeconds <= end;
                    return (
                        <div
                            key={i}
                            className={cssStyles.networkTick}
                            style={{
                                left: `${tickPct}%`,
                                background: getMethodColor(item.request.method as any),
                                opacity: inside ? 0.6 : 0.15
                            }}
                        />
                    );
                })}

                <div
                    onMouseDown={onMouseDown("start")}
                    onTouchStart={onTouchStart("start")}
                    className={cssStyles.handle}
                    style={{
                        left: `${startPct}%`,
                        background: "var(--theme-info)",
                        boxShadow: "0 0 0 1px var(--theme-info), 0 2px 8px rgba(0,0,0,0.5)",
                    }}
                />

                <div
                    onMouseDown={onMouseDown("end")}
                    onTouchStart={onTouchStart("end")}
                    className={cssStyles.handle}
                    style={{
                        left: `${endPct}%`,
                        background: isFullRange ? "var(--theme-success)" : "var(--theme-warning)",
                        boxShadow: `0 0 0 1px ${isFullRange ? "var(--theme-success)" : "var(--theme-warning)"}, 0 2px 8px rgba(0,0,0,0.5)`,
                    }}
                />
            </div>

            <div className={cssStyles.axisWrapper}>
                {duration > 0 && Array.from({ length: 5 }).map((_, i) => {
                    const t = min + (i / 4) * (max - min);
                    return (
                        <span key={i} className={cssStyles.axisTick} style={{ left: `${(i / 4) * 100}%` }}>
                            {formatSeconds(t)}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}