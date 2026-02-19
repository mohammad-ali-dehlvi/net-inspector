// FloatingDetailPanel.tsx
// Drop-in replacement: wraps <DetailPanel> in a draggable/resizable/minimizable/closable popup.
// Usage:
//   <FloatingDetailPanel item={...} onClose={() => setSelectedIndex(null)} />

import { useCallback, useEffect, useRef, useState } from "react";
import DetailPanel from "src/client/pages/video_detail/components/DetailPanel";
import { NetworkItemType } from "src/shared/types";
import { getMethodColor, formatSeconds } from "src/client/pages/video_detail/utils/helper";
import _ from "lodash";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Rect { x: number; y: number; w: number; h: number }

const MIN_W = 320;
const MIN_H = 200;
const DEFAULT_W = 480;
const DEFAULT_H = 420;
const HEADER_H = 36;

// ─── Resize handle directions ─────────────────────────────────────────────────
type ResizeDir =
  | "n" | "s" | "e" | "w"
  | "ne" | "nw" | "se" | "sw";

const HANDLE_SIZE = 6; // px hit-area for edge handles

// ─── Helper: clamp rect inside viewport ──────────────────────────────────────
function clampRect(r: Rect): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.max(MIN_W, Math.min(r.w, vw));
  const h = Math.max(MIN_H, Math.min(r.h, vh));
  const x = Math.max(0, Math.min(r.x, vw - w));
  const y = Math.max(0, Math.min(r.y, vh - h));
  return { x, y, w, h };
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface FloatingDetailPanelProps {
  item: NetworkItemType | null;
  index: number | null;
  onClose: () => void;
}

export default function FloatingDetailPanel({
  item,
  index,
  onClose,
}: FloatingDetailPanelProps) {
  const [minimized, setMinimized] = useState(false);
  const [rect, setRect] = useState<Rect>(() => ({
    x: Math.max(0, window.innerWidth - DEFAULT_W - 24),
    y: Math.max(0, window.innerHeight - DEFAULT_H - 24),
    w: DEFAULT_W,
    h: DEFAULT_H,
  }));

  // Remember pre-minimize height
  const preMinimizeH = useRef(DEFAULT_H);

  // ── Drag state ──────────────────────────────────────────────────────────────
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

  // ── Resize state ────────────────────────────────────────────────────────────
  const resizeStart = useRef<{
    dir: ResizeDir;
    mx: number; my: number;
    rx: number; ry: number; rw: number; rh: number;
  } | null>(null);

  const onResizeMouseDown = useCallback((dir: ResizeDir) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStart.current = {
      dir, mx: e.clientX, my: e.clientY,
      rx: rect.x, ry: rect.y, rw: rect.w, rh: rect.h,
    };

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

  // ── Minimize toggle ─────────────────────────────────────────────────────────
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

  // Re-open if a new item is selected while minimized
  useEffect(() => {
    if (item && minimized) {
      setMinimized(false);
      setRect(r => ({ ...r, h: preMinimizeH.current }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  // ── Keyboard: Esc to close ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // ── Cursor for resize handles ───────────────────────────────────────────────
  const CURSORS: Record<ResizeDir, string> = {
    n: "ns-resize", s: "ns-resize",
    e: "ew-resize", w: "ew-resize",
    ne: "nesw-resize", sw: "nesw-resize",
    nw: "nwse-resize", se: "nwse-resize",
  };

  const mc = item ? getMethodColor(item.request.method as any) : "#4a5568";
  const title = index !== null ? `REQUEST #${String(index + 1).padStart(2, "0")}` : "REQUEST DETAILS";
  const methodLabel = _.get(item, 'request.method', '')

  return (
    <div
      style={{
        position: "fixed",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: minimized ? HEADER_H : rect.h,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        background: "#0d0f14",
        border: `1px solid ${mc}44`,
        borderRadius: "7px",
        boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px #141820, 0 0 20px ${mc}12`,
        overflow: "hidden",
        transition: "height 0.18s ease, box-shadow 0.2s",
        fontFamily: "'JetBrains Mono', monospace",
        userSelect: "none",
      }}
    >
      {/* ── Resize handles (8 directions) ── */}
      {!minimized && (
        <>
          {/* Edges */}
          {(["n", "s", "e", "w"] as ResizeDir[]).map(dir => (
            <div
              key={dir}
              onMouseDown={onResizeMouseDown(dir)}
              style={{
                position: "absolute",
                cursor: CURSORS[dir],
                zIndex: 10,
                ...(dir === "n" ? { top: 0, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE } :
                  dir === "s" ? { bottom: 0, left: HANDLE_SIZE, right: HANDLE_SIZE, height: HANDLE_SIZE } :
                    dir === "e" ? { right: 0, top: HANDLE_SIZE, bottom: HANDLE_SIZE, width: HANDLE_SIZE } :
                      { left: 0, top: HANDLE_SIZE, bottom: HANDLE_SIZE, width: HANDLE_SIZE }),
              }}
            />
          ))}
          {/* Corners */}
          {(["ne", "nw", "se", "sw"] as ResizeDir[]).map(dir => (
            <div
              key={dir}
              onMouseDown={onResizeMouseDown(dir)}
              style={{
                position: "absolute",
                width: HANDLE_SIZE + 4, height: HANDLE_SIZE + 4,
                cursor: CURSORS[dir],
                zIndex: 11,
                ...(dir === "ne" ? { top: 0, right: 0 } :
                  dir === "nw" ? { top: 0, left: 0 } :
                    dir === "se" ? { bottom: 0, right: 0 } :
                      { bottom: 0, left: 0 }),
              }}
            />
          ))}
        </>
      )}

      {/* ── Title bar ── */}
      <div
        onMouseDown={onDragMouseDown}
        style={{
          height: HEADER_H,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: "9px",
          padding: "0 12px 0 14px",
          background: "#0a0c10",
          borderBottom: minimized ? "none" : "1px solid #141820",
          cursor: "move",
        }}
      >
        {/* Method badge */}
        {methodLabel && (
          <span style={{
            fontSize: "9px", fontWeight: "700", letterSpacing: "0.1em",
            color: mc, background: `${mc}18`,
            padding: "2px 7px", borderRadius: "3px",
            border: `1px solid ${mc}35`,
            flexShrink: 0,
          }}>
            {methodLabel}
          </span>
        )}

        {/* Title */}
        <span style={{
          fontSize: "10px", color: "#718096",
          letterSpacing: "0.08em",
          flex: 1, minWidth: 0,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </span>

        {/* Timing pill — shown when not minimized */}
        {item && !minimized && (
          <span style={{
            fontSize: "8px", color: "#3d4451",
            fontFamily: "'JetBrains Mono', monospace",
            flexShrink: 0,
          }}>
            {formatSeconds(item.startSeconds)} → {formatSeconds(item.endSeconds)}
          </span>
        )}

        {/* Window buttons */}
        <div data-no-drag style={{ display: "flex", alignItems: "center", gap: "5px", marginLeft: "6px" }}>
          {/* Minimize */}
          <button
            onClick={toggleMinimize}
            title={minimized ? "Restore" : "Minimize"}
            style={{
              width: "18px", height: "18px", borderRadius: "50%",
              background: minimized ? "rgba(251,146,60,0.25)" : "rgba(251,146,60,0.15)",
              border: "1px solid rgba(251,146,60,0.35)",
              color: "#fb923c", fontSize: "10px", lineHeight: 1,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
              padding: 0,
            }}
          >
            {minimized ? "▴" : "▾"}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            title="Close (Esc)"
            style={{
              width: "18px", height: "18px", borderRadius: "50%",
              background: "rgba(248,113,113,0.15)",
              border: "1px solid rgba(248,113,113,0.35)",
              color: "#f87171", fontSize: "11px", lineHeight: 1,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background .15s",
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      {!minimized && (
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <DetailPanel item={item} />
        </div>
      )}

      {/* ── Resize grip icon (bottom-right corner) ── */}
      {!minimized && (
        <div
          onMouseDown={onResizeMouseDown("se")}
          style={{
            position: "absolute", bottom: 3, right: 4,
            cursor: "nwse-resize",
            color: "#2d3748", fontSize: "10px", lineHeight: 1,
            zIndex: 12, userSelect: "none",
            pointerEvents: "auto",
          }}
        >
          ⠿
        </div>
      )}
    </div>
  );
}