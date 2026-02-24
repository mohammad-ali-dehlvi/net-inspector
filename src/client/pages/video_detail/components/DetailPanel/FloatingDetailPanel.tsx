import { useCallback, useEffect, useRef, useState } from "react";
import DetailPanel from "src/client/pages/video_detail/components/DetailPanel";
import { getMethodColor, formatSeconds } from "src/client/pages/video_detail/utils/helper";
import _ from "lodash";
import { useVideoDetailContext } from "src/client/pages/video_detail/context/videoDetail";
import { useVideoDetailPlayerContext } from "src/client/pages/video_detail/context/VideoDetailPlayerContext";
import cssStyles from "src/client/pages/video_detail/components/DetailPanel/style.module.css";

interface Rect { x: number; y: number; w: number; h: number }

const MIN_W = 320;
const MIN_H = 200;
const DEFAULT_W = 480;
const DEFAULT_H = 420;
const HEADER_H = 36;
const HANDLE_SIZE = 6;

type ResizeDir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

function clampRect(r: Rect): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.max(MIN_W, Math.min(r.w, vw));
  const h = Math.max(MIN_H, Math.min(r.h, vh));
  const x = Math.max(0, Math.min(r.x, vw - w));
  const y = Math.max(0, Math.min(r.y, vh - h));
  return { x, y, w, h };
}

export default function FloatingDetailPanel() {
  const { requests } = useVideoDetailContext()
  const { selectedIndex, setSelectedIndex } = useVideoDetailPlayerContext()

  const item = requests?.[selectedIndex ?? -1] ?? null;
  const [minimized, setMinimized] = useState(false);
  const [rect, setRect] = useState<Rect>(() => ({
    x: Math.max(0, window.innerWidth - DEFAULT_W - 24),
    y: Math.max(0, window.innerHeight - DEFAULT_H - 24),
    w: DEFAULT_W,
    h: DEFAULT_H,
  }));

  const preMinimizeH = useRef(DEFAULT_H);
  const dragStart = useRef<{ mx: number; my: number; rx: number; ry: number } | null>(null);

  const onDragMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-no-drag]")) return;
    e.preventDefault();
    dragStart.current = { mx: e.clientX, my: e.clientY, rx: rect.x, ry: rect.y };

    const onMove = (me: MouseEvent) => {
      if (!dragStart.current) return;
      const dx = me.clientX - dragStart.current.mx;
      const dy = me.clientY - dragStart.current.my;
      setRect(r => dragStart.current ? clampRect({ ...r, x: dragStart.current!.rx + dx, y: dragStart.current!.ry + dy }) : r);
    };
    const onUp = () => {
      dragStart.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [rect.x, rect.y]);

  const resizeStart = useRef<{ dir: ResizeDir; mx: number; my: number; rx: number; ry: number; rw: number; rh: number; } | null>(null);

  const onResizeMouseDown = useCallback((dir: ResizeDir) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = { dir, mx: e.clientX, my: e.clientY, rx: rect.x, ry: rect.y, rw: rect.w, rh: rect.h };

    const onMove = (me: MouseEvent) => {
      if (!resizeStart.current) return;
      const { dir, mx, my, rx, ry, rw, rh } = resizeStart.current;
      const dx = me.clientX - mx;
      const dy = me.clientY - my;
      let x = rx, y = ry, w = rw, h = rh;

      if (dir.includes("e")) w = Math.max(MIN_W, rw + dx);
      if (dir.includes("s")) h = Math.max(MIN_H, rh + dy);
      if (dir.includes("w")) { w = Math.max(MIN_W, rw - dx); x = rx + rw - w; }
      if (dir.includes("n")) { h = Math.max(MIN_H, rh - dy); y = ry + rh - h; }
      setRect(clampRect({ x, y, w, h }));
    };
    const onUp = () => {
      resizeStart.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [rect]);

  const handleClose = useCallback(() => setSelectedIndex(null), [setSelectedIndex]);

  const toggleMinimize = useCallback(() => {
    setMinimized(prev => {
      if (!prev) {
        preMinimizeH.current = rect.h;
        setRect(r => ({ ...r, h: HEADER_H }));
      } else {
        setRect(r => ({ ...r, h: preMinimizeH.current }));
      }
      return !prev;
    });
  }, [rect.h]);

  useEffect(() => {
    if (item && minimized) {
      setMinimized(false);
      setRect(r => ({ ...r, h: preMinimizeH.current }));
    }
  }, [item]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const CURSORS: Record<ResizeDir, string> = {
    n: "ns-resize", s: "ns-resize", e: "ew-resize", w: "ew-resize",
    ne: "nesw-resize", sw: "nesw-resize", nw: "nwse-resize", se: "nwse-resize",
  };

  const mc = item ? getMethodColor(item.request.method as any) : "var(--text-dark)";
  const title = selectedIndex !== null ? `REQUEST #${String(selectedIndex + 1).padStart(2, "0")}` : "REQUEST DETAILS";
  const methodLabel = _.get(item, 'request.method', '');

  return (
    <div
      className={cssStyles.floatingWrapper}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: minimized ? HEADER_H : rect.h,
        border: `1px solid ${mc}44`,
        boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px #141820, 0 0 20px ${mc}12`,
      }}
    >
      {!minimized && (
        <>
          {(["n", "s", "e", "w"] as ResizeDir[]).map(dir => (
            <div
              key={dir}
              onMouseDown={onResizeMouseDown(dir)}
              className={cssStyles.resizeHandle}
              style={{
                cursor: CURSORS[dir],
                ...(dir === "n" ? { top: 0, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE } :
                  dir === "s" ? { bottom: 0, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE } :
                    dir === "e" ? { right: 0, top: HANDLE_SIZE, bottom: HANDLE_SIZE, width: HANDLE_SIZE } :
                      { left: 0, top: HANDLE_SIZE, bottom: HANDLE_SIZE, width: HANDLE_SIZE }),
              }}
            />
          ))}
          {(["ne", "nw", "se", "sw"] as ResizeDir[]).map(dir => (
            <div
              key={dir}
              onMouseDown={onResizeMouseDown(dir)}
              className={cssStyles.resizeCorner}
              style={{
                cursor: CURSORS[dir],
                ...(dir === "ne" ? { top: 0, right: 0 } :
                  dir === "nw" ? { top: 0, left: 0 } :
                    dir === "se" ? { bottom: 0, right: 0 } :
                      { bottom: 0, left: 0 }),
              }}
            />
          ))}
        </>
      )}

      <div
        onMouseDown={onDragMouseDown}
        className={cssStyles.titleBar}
        style={{ borderBottom: minimized ? "none" : "1px solid #141820" }}
      >
        {methodLabel && (
          <span
            className={cssStyles.methodBadge}
            style={{ color: mc, background: `${mc}18`, border: `1px solid ${mc}35` }}
          >
            {methodLabel}
          </span>
        )}

        <span className={cssStyles.titleText}>{title}</span>

        {item && !minimized && (
          <span className={cssStyles.timingPill}>
            {formatSeconds(item.startSeconds)} → {formatSeconds(item.endSeconds)}
          </span>
        )}

        <div data-no-drag className={cssStyles.windowButtons}>
          <button
            onClick={toggleMinimize}
            title={minimized ? "Restore" : "Minimize"}
            className={`${cssStyles.windowBtn} ${cssStyles.minimizeBtn} ${minimized ? cssStyles.minimizeBtnActive : ''}`}
          >
            {minimized ? "▴" : "▾"}
          </button>
          <button onClick={handleClose} title="Close (Esc)" className={`${cssStyles.windowBtn} ${cssStyles.closeBtn}`}>
            ✕
          </button>
        </div>
      </div>

      {!minimized && (
        <div className={cssStyles.contentBody}>
          <DetailPanel />
        </div>
      )}

      {!minimized && (
        <div onMouseDown={onResizeMouseDown("se")} className={cssStyles.resizeGrip}>
          ⠿
        </div>
      )}
    </div>
  );
}