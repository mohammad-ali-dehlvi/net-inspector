const METHOD_COLORS = {
  GET: "var(--theme-success)", POST: "var(--theme-warning)", PUT: "var(--theme-info)",
  PATCH: "#c084fc", DELETE: "var(--theme-error)", OPTIONS: "#94a3b8",
};
const METHOD_VARIANTS = {
  GET: "success", POST: "warning", PUT: "info", DELETE: "error"
}
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

const TAG_COLORS: Record<string, string> = {
  json: "var(--tag-json)",
  text: "var(--tag-text)",
  image: "var(--tag-image)",
  video: "var(--tag-video)",
  html: "var(--tag-html)",
  audio: "var(--tag-audio)",
  pdf: "var(--tag-pdf)",
  unknown: "var(--tag-unknown)",
};

const EXT_MAP: Record<string, string> = {
  json: "json",
  text: "txt",
  image: "png",
  video: "mp4",
  audio: "mp3",
  html: "html",
  pdf: "pdf",
  unknown: "bin",
};

export { METHOD_COLORS, METHOD_VARIANTS, SEEK_SECONDS, SPEED_OPTIONS, ALL_METHODS, TYPE_COLORS, TAG_COLORS, EXT_MAP }