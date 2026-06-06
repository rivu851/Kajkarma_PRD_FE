import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiErrorResponse } from "@/types/api.types";
import type { RefreshResponse } from "@/types/auth.types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// ─── Cookie helpers ────────────────────────────────────────────────────────────

const AUTH_COOKIE_OPTIONS = "path=/; SameSite=Lax";

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(name.length + 1));
}

function writeCookie(name: string, value: string, maxAge?: number) {
  if (typeof document === "undefined") return;
  const parts = [`${name}=${encodeURIComponent(value)}`, AUTH_COOKIE_OPTIONS];
  if (typeof maxAge === "number") parts.splice(1, 0, `max-age=${maxAge}`);
  document.cookie = parts.join("; ");
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; ${AUTH_COOKIE_OPTIONS}; max-age=0`;
}

// ─── Token helpers ─────────────────────────────────────────────────────────────

function getStoredTokens() {
  if (typeof document === "undefined") return { accessToken: null };
  return { accessToken: readCookie("accessToken") };
}

// sessionActive persists for the lifetime of the refresh token so that
// hasStoredTokens() returns true even after the short-lived accessToken expires.
export function setStoredTokens(accessToken: string) {
  writeCookie("accessToken", accessToken, 15 * 60);
  writeCookie("sessionActive", "1", 7 * 24 * 60 * 60);
}

export function clearStoredTokens() {
  clearCookie("accessToken");
  clearCookie("sessionActive");
}

export function hasStoredTokens() {
  if (typeof document === "undefined") return false;
  return Boolean(readCookie("accessToken") || readCookie("sessionActive"));
}

// ─── Refresh mutex ─────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else if (token) p.resolve(token);
  });
  refreshQueue = [];
}

// Fires POST /auth/refresh. Multiple concurrent callers share a single in-flight
// request via the queue so the server only sees one refresh per expiry cycle.
async function acquireNewToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      refreshQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const { data: body } = await axios.post<{
      success: boolean;
      message: string;
      data: RefreshResponse;
    }>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true, headers: { "Content-Type": "application/json" } }
    );
    const newAccess = body.data?.accessToken;
    if (!newAccess) throw new Error("No access token in refresh response");
    setStoredTokens(newAccess);
    flushQueue(null, newAccess);
    return newAccess;
  } catch (err) {
    flushQueue(err, null);
    throw err;
  } finally {
    isRefreshing = false;
  }
}

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.href = "/login";
}

// ─── Request interceptor ───────────────────────────────────────────────────────
// If no accessToken cookie is present, proactively refreshes before the request
// goes out. Redirects to /login and rejects the request on refresh failure.

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (
    config.url?.includes("/auth/login") ||
    config.url?.includes("/auth/refresh")
  ) {
    return config;
  }

  const { accessToken } = getStoredTokens();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
  }

  // No access token — attempt refresh before allowing the request through.
  try {
    const token = await acquireNewToken();
    config.headers.Authorization = `Bearer ${token}`;
  } catch {
    clearStoredTokens();
    redirectToLogin();
    return Promise.reject(new Error("Session expired. Please log in again."));
  }

  return config;
});

// ─── Response interceptor ─────────────────────────────────────────────────────
// Handles 401s that slip through (token valid at request time but revoked
// server-side). Uses the same acquireNewToken mutex so refresh never fires twice.

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const token = await acquireNewToken();
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch {
        clearStoredTokens();
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ─── Error helper ──────────────────────────────────────────────────────────────

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.message ?? error.message ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
