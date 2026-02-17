import { METHOD_COLORS } from "src/client/pages/video_detail/utils/constants"
import { NetworkItemType } from "src/shared/types";

export const getMethodColor = (m?: keyof typeof METHOD_COLORS) => {
  return m ? METHOD_COLORS[m] : "#94a3b8"
}
export const formatSeconds = (s: string | number) => { return Number(s).toFixed(2) + "s" };
export const formatTime = (s: number) => { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`; };
export const getDomain = (url: string) => { try { return new URL(url).hostname; } catch { return url; } };
export const getPath = (url: string) => { try { const u = new URL(url); return u.pathname + u.search; } catch { return url; } };
export const isActive = (item: NetworkItemType, t: number) => t >= item.start_seconds && t <= item.end_seconds;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// item overlaps with [rangeStart, rangeEnd] — at least partially inside the range
export const inRange = (item: NetworkItemType, rs: number, re: number) =>
  item.start_seconds < re && item.end_seconds > rs;

export function itemMatchesQuery(item: NetworkItemType, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();

  // url
  if (item.url.toLowerCase().includes(q)) return true;
  // method
  if (item.method.toLowerCase().includes(q)) return true;
  // headers keys + values
  for (const [k, v] of Object.entries(item.headers)) {
    if (k.toLowerCase().includes(q) || v.toLowerCase().includes(q)) return true;
  }
  // post_data string
  if (item.post_data?.toLowerCase().includes(q)) return true;
  // post_data_json — stringify and search
  if (item.post_data_json) {
    try {
      if (JSON.stringify(item.post_data_json).toLowerCase().includes(q)) return true;
    } catch { /* noop */ }
  }
  // timing
  if (String(item.start_seconds).includes(q)) return true;
  if (String(item.end_seconds).includes(q)) return true;

  return false;
}