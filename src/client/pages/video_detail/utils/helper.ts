import { AxiosResponse } from "axios";
import { unescape } from "lodash";
import { METHOD_COLORS } from "src/client/pages/video_detail/utils/constants"
import { BrowserApiResponse } from "src/server/routers/browser/types";
import { NetworkItemType } from "src/shared/types";

export const getMethodColor = (m?: keyof typeof METHOD_COLORS) => {
  return m ? METHOD_COLORS[m] : "#94a3b8"
}
export const formatSeconds = (s: string | number) => { return Number(s).toFixed(2) + "s" };
export const formatTime = (s: number) => { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`; };
export const getDomain = (url: string) => { try { return new URL(url).hostname; } catch { return url; } };
export const getPath = (url: string) => { try { const u = new URL(url); return u.pathname + u.search; } catch { return url; } };
export const isActive = (item: NetworkItemType, t: number) => t >= item.startSeconds && t <= item.endSeconds;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// item overlaps with [rangeStart, rangeEnd] — at least partially inside the range
export const inRange = (item: NetworkItemType, rs: number, re: number) =>
  item.startSeconds < re && item.endSeconds > rs;

export function itemMatchesQuery(item: NetworkItemType, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();

  // url
  if (item.request.url.toLowerCase().includes(q)) return true;
  // method
  if (item.request.method.toLowerCase().includes(q)) return true;
  // headers keys + values
  for (const [k, v] of [...Object.entries(item.request.headers), ...Object.entries(item.response.headers)]) {
    if (k.toLowerCase().includes(q) || v.toLowerCase().includes(q)) return true;
  }
  // post_data string
  if (item.request.postData?.toLowerCase().includes(q)) return true;
  // post_data_json — stringify and search
  if (item.request.postDataJSON) {
    try {
      if (JSON.stringify(item.request.postDataJSON).toLowerCase().includes(q)) return true;
    } catch { /* noop */ }
  }
  // timing
  if (String(item.startSeconds).includes(q)) return true;
  if (String(item.endSeconds).includes(q)) return true;

  return false;
}

export const isString = (v: unknown): v is string => typeof v === "string"

export const safeJsonParse = (input: string) => {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

export const normalizeBinaryString = (input: string) => {
  // Handles escaped \u0000 sequences
  return input.replace(/\\u0000/g, "\u0000")
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log("blob to base64 result: ", reader.result)
      resolve(reader.result as string)
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob); // this already gives base64
  });
}

export const buildDataUrl = (
  contentType: string,
  raw: string
) => {
  // If already base64 assume correct
  if (/^[A-Za-z0-9+/=]+$/.test(raw.slice(0, 100))) {
    return `data:${contentType};base64,${raw}`
  }

  // Otherwise encode
  const encoded = (() => {
    try {
      return btoa(raw)
    } catch (err) {
      console.log("error in encoded: ", err)
      console.log("raw: ", raw)
      return btoa(unescape(encodeURIComponent(raw)))
    }
  })()
  return `data:${contentType};base64,${encoded}`
}

export const createObjectUrlFromBinaryString = (
  contentType: string,
  binaryString: string
) => {
  // Convert string to Uint8Array safely
  const bytes = new Uint8Array(
    Array.from(binaryString, char => char.charCodeAt(0))
  )

  const blob = new Blob([bytes], { type: contentType })
  return URL.createObjectURL(blob)
}