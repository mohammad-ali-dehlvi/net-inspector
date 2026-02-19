const METHOD_COLORS = {
  GET: "#4ade80", POST: "#fb923c", PUT: "#60a5fa",
  PATCH: "#c084fc", DELETE: "#f87171", OPTIONS: "#94a3b8",
};
const ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;
const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SEEK_SECONDS = 5;

const TYPE_COLORS = {
  json: "var(--tag-json)",
  text: "var(--tag-text)",
  image: "var(--tag-image)",
  video: "var(--tag-video)",
  html: "var(--tag-html)",
  audio: "var(--tag-audio)",
  pdf: "var(--tag-image)",
  unknown: "var(--tag-unknown)",
};

const TAG_COLORS: Record<MediaType, string> = {
  json: "var(--tag-json)",
  text: "var(--tag-text)",
  image: "var(--tag-image)",
  video: "var(--tag-video)",
  html: "var(--tag-html)",
  audio: "var(--tag-audio)",
  pdf: "var(--tag-pdf)",
  unknown: "var(--tag-unknown)",
};

const EXT_MAP: Record<MediaType, string> = {
  json: "json",
  text: "txt",
  image: "png",
  video: "mp4",
  audio: "mp3",
  html: "html",
  pdf: "pdf",
  unknown: "bin",
};

export { METHOD_COLORS, SEEK_SECONDS, SPEED_OPTIONS, ALL_METHODS, TYPE_COLORS, TAG_COLORS, EXT_MAP }