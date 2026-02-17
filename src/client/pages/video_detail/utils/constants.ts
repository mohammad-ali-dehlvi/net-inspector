const METHOD_COLORS = {
  GET: "#4ade80", POST: "#fb923c", PUT: "#60a5fa",
  PATCH: "#c084fc", DELETE: "#f87171", OPTIONS: "#94a3b8",
};
const ALL_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"] as const;
const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
const SEEK_SECONDS = 5;

export { METHOD_COLORS, SEEK_SECONDS, SPEED_OPTIONS, ALL_METHODS }