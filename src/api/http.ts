/**
 * The one place that talks HTTP.
 *
 * Every endpoint function in src/api/*.ts goes through `request()` when
 * mocks are off, so auth headers, error handling and the base URL live here.
 *
 * Settings come from .env.local (see .env.example):
 *   VITE_USE_MOCKS=true|false
 *   VITE_API_BASE_URL=https://…
 */

export const USE_MOCKS = (import.meta.env.VITE_USE_MOCKS ?? 'true') !== 'false';
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

/** Error thrown for any non-2xx response. `status` lets screens react (e.g. 403). */
export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  /** Send the browser to sign-in when the session has expired (default true). */
  redirectOnUnauthorized?: boolean;
}

export async function request<T>(method: Method, path: string, body?: unknown, options: RequestOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    // Sessions are expected to be HTTP-only cookies set by the backend.
    // The browser never sees or stores tokens or client secrets.
    credentials: 'include',
    headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) {
    // Session expired or missing: send the user to Keycloak, then back here.
    if (options.redirectOnUnauthorized !== false) {
      window.location.assign(loginUrl(window.location.pathname + window.location.search));
    }
    throw new ApiError(401, 'Your session has ended. Please sign in again.');
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    try {
      const data = await res.json();
      message = data.message ?? message;
      code = data.code;
    } catch {
      /* response had no JSON body */
    }
    throw new ApiError(res.status, message, code);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

/** Builds "?a=1&b=2" from an object, skipping empty values. */
export function query(params: Record<string, string | number | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

/** Used by mock mode to feel like a real network call. */
export function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms));
}

/**
 * Backend URL that starts the OpenID Connect sign-in with Keycloak.
 * `returnTo` must be a path on this site; the backend must reject anything else
 * (otherwise it becomes an open redirect).
 */
export function loginUrl(returnTo = '/'): string {
  return `${API_BASE_URL}/auth/login${query({ returnTo })}`;
}

/** Same as loginUrl, but opens Keycloak's registration page. */
export function registerUrl(returnTo = '/onboarding'): string {
  return `${API_BASE_URL}/auth/register${query({ returnTo })}`;
}
