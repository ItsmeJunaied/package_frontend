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
