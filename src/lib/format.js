export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatMoney(kobo, { decimals = 0 } = {}) {
  const value = Number(kobo || 0) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(date);
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

export function getPrimaryImage(images = []) {
  if (!Array.isArray(images) || images.length === 0) return null;
  return images.find((image) => image.isPrimary) || images[0];
}

export function getErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  return error.message || fallback;
}

export function absoluteUrl(path) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createIdempotencyKey() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

