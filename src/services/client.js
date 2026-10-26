import { useAdminAuthStore } from "../store/adminAuthStore";

const configuredBase = import.meta.env.VITE_API_BASE_URL || "https://kubecart-backend.onrender.com";

export const API_BASE_URL = `${configuredBase.replace(/\/+$/, "")}/api/v1`;

export class ApiError extends Error {
  constructor(status, message, details = {}) {
    super(message || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.issues = details.issues || [];
    this.requestId = details.requestId || null;
    this.code = details.code || null;
  }
}

function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function request(path, options = {}) {
  const { method = "GET", body, headers = {}, auth = false, signal, query } = options;
  const requestHeaders = new Headers(headers);
  let requestBody = body;

  if (body !== undefined && body !== null && !(body instanceof FormData)) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  if (auth) {
    const token = useAdminAuthStore.getState().token;
    if (token) requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${toQueryString(query)}`, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal,
      credentials: "omit",
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(0, "Unable to reach the store. Check your connection and try again.", {});
  }

  const data = await parseResponseBody(response);

  if (!response.ok) {
    const message =
      data?.message ||
      (response.status === 429
        ? "Too many requests. Please wait a moment and try again."
        : `Request failed (${response.status})`);

    if (response.status === 401 && auth) {
      useAdminAuthStore.getState().clearSession();
    }

    throw new ApiError(response.status, message, {
      issues: data?.issues,
      requestId: data?.requestId || response.headers.get("x-request-id"),
      code: data?.error,
    });
  }

  return data;
}

export { toQueryString };
