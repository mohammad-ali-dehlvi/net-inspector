import { AxiosResponse } from "axios";
import { unescape } from "lodash";
import { METHOD_COLORS, METHOD_VARIANTS } from "src/client/pages/video_detail/utils/constants"
import { BrowserApiResponse } from "src/server/routers/browser/types";
import { NetworkItemType } from "src/shared/types";

type MethodColorKey =
  | keyof typeof METHOD_COLORS
  | keyof typeof METHOD_VARIANTS;

export const getMethodColor = (
  m?: MethodColorKey,
  variant: boolean = false
): string | undefined => {
  if (variant) {
    if (m && m in METHOD_VARIANTS) {
      return METHOD_VARIANTS[m as keyof typeof METHOD_VARIANTS];
    }
    return undefined
  }

  if (m && m in METHOD_COLORS) {
    return METHOD_COLORS[m as keyof typeof METHOD_COLORS];
  }

  return "#94a3b8";
};
export const formatSeconds = (s: string | number) => { return Number(s).toFixed(2) + "s" };
export const formatTime = (s: number) => { const m = Math.floor(s / 60); return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`; };
export const getDomain = (url: string) => { try { return new URL(url).hostname; } catch { return url; } };
export const getPath = (url: string) => { try { const u = new URL(url); return u.pathname + u.search; } catch { return url; } };
export const isActive = (item: NetworkItemType, t: number) => t >= item.startSeconds && t <= item.endSeconds;
export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// item overlaps with [rangeStart, rangeEnd] — at least partially inside the range
export const inRange = (item: NetworkItemType, rs: number, re: number) =>
  item.startSeconds < re && item.endSeconds > rs;

export function itemMatchesQuery(item: NetworkItemType, queries: string[]): boolean {
  const handler = (query: string) => {
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

    if (item.pageUrl && String(item.pageUrl).includes(q)) return true;

    return false;
  }
  return queries.length === 0 || queries.some(handler)
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


// =================================================
/**
 * Replace all numbers in a string with a placeholder
 */
function normalizeNumbersInString(value: string): string {
  return value.replace(/\d+(\.\d+)?/g, "__NUMBER__");
}

/**
 * Normalize URL by:
 * - Removing numeric differences from query params
 */
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const base = parsed.origin + parsed.pathname;

    const params = new URLSearchParams(parsed.search);
    const normalizedParams = new URLSearchParams();

    params.forEach((value, key) => {
      normalizedParams.set(key, normalizeNumbersInString(value));
    });

    return base + "?" + normalizedParams.toString();
  } catch {
    return normalizeNumbersInString(url);
  }
}

/**
 * Deep normalize JSON object by replacing numbers
 */
function normalizeJSON(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "number") {
    return "__NUMBER__";
  }

  if (typeof obj === "string") {
    return normalizeNumbersInString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeJSON);
  }

  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = normalizeJSON(obj[key]);
    }
    return result;
  }

  return obj;
}

/**
 * Compare two values deeply
 */
function deepEqual(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Check if two network items are similar (only numeric differences allowed)
 */
function isSimilarRequest(
  a: NetworkItemType,
  b: NetworkItemType
): boolean {
  if (a.request.method !== b.request.method) return false;

  // Compare normalized URLs
  const urlA = normalizeUrl(a.request.url);
  const urlB = normalizeUrl(b.request.url);

  if (urlA !== urlB) return false;

  // Compare normalized postData string
  const postDataA =
    typeof a.request.postData === "string"
      ? normalizeNumbersInString(a.request.postData)
      : "";

  const postDataB =
    typeof b.request.postData === "string"
      ? normalizeNumbersInString(b.request.postData)
      : "";

  if (postDataA !== postDataB) return false;

  // Compare normalized JSON
  const jsonA = normalizeJSON(a.request.postDataJSON);
  const jsonB = normalizeJSON(b.request.postDataJSON);

  if (!deepEqual(jsonA, jsonB)) return false;

  return true;
}

/**
 * Main function
 */
export function findSimilarAPIs(
  item: NetworkItemType,
  requests: NetworkItemType[]
): NetworkItemType[] {
  return requests.filter(
    (req) =>
      // req !== item &&
      isSimilarRequest(item, req)
  );
}