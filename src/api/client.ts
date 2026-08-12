import { hc, type ClientResponse } from 'hono/client';

// Type-only. Erased at build time, so no backend code ever reaches the bundle —
// this is purely the compiler reading the API's route map (DESIGN.md §9.3).
import type { AppType } from '@api/index';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

const TOKEN_KEY = 'onway.staff.token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private browsing — the app still works, the session just won't persist */
  }
}

/**
 * Broadcast when the API rejects our token — expired, revoked, or signed by a
 * server that has since rotated its secret.
 *
 * An event rather than a direct call because this module is deliberately
 * React-free; `AuthProvider` subscribes and tears the session down, which sends
 * `RequireAuth` back to the login screen. Without this the app sits there
 * showing an error on every panel while still believing it is signed in.
 */
export const UNAUTHORIZED_EVENT = 'onway:unauthorized';

/**
 * The typed RPC client. Every path, method, request body and response shape is
 * inferred from the backend's `AppType` — no OpenAPI step, no generated SDK,
 * and a route signature change breaks the build here rather than in production.
 */
export const client = hc<AppType>(API_URL, {
  headers: (): Record<string, string> => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
});

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly details: unknown = null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
}

type AnyJsonResponse = ClientResponse<unknown, number, 'json'>;

/**
 * A Hono RPC call resolves to a *union* of every response the route can
 * produce — including the typed 400 that `zValidator`'s failure hook emits.
 * This picks the 2xx member out of that union, so callers get the success
 * shape and nothing else.
 */
type SuccessBody<R> =
  R extends ClientResponse<infer T, infer S, 'json'> ? (S extends 200 | 201 | 202 ? T : never)
  : never;

/**
 * The failure branch is handled here rather than by inference: `app.onError`
 * responses are not part of the RPC client's inferred types (a known Hono
 * limitation, noted in DESIGN.md §9.3). Anything non-`ok` is read as the shared
 * error envelope and re-thrown as an ApiError, so every consumer — TanStack
 * Query included — sees one error type with a usable `message`, `status` and `code`.
 */
export async function unwrap<R extends AnyJsonResponse>(
  promise: Promise<R>,
): Promise<SuccessBody<R>> {
  let res: R;

  try {
    res = await promise;
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${API_URL}. Is the backend running?`,
      0,
      'NETWORK_ERROR',
    );
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ErrorEnvelope | null;

    // Don't fire on the login request itself — a wrong password is a 401 the
    // form handles, not a session that just died.
    if (res.status === 401 && getToken()) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }

    throw new ApiError(
      body?.error?.message ?? `Request failed with status ${res.status}`,
      res.status,
      body?.error?.code ?? 'UNKNOWN',
      body?.error?.details ?? null,
    );
  }

  return (await res.json()) as SuccessBody<R>;
}

export { API_URL };
