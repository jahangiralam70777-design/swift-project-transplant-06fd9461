export type SafeRequestResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; error: SafeRequestError; status: number };

export type SafeRequestError = {
  message: string;
  code: string;
  status?: number;
  route?: string;
  cause?: unknown;
};

export class SafeRequestException extends Error {
  code: string;
  status?: number;
  route?: string;
  cause?: unknown;

  constructor(error: SafeRequestError) {
    super(error.message);
    this.name = "SafeRequestException";
    this.code = error.code;
    this.status = error.status;
    this.route = error.route;
    this.cause = error.cause;
  }
}

const DEFAULT_TIMEOUT_MS = 15_000;

export function normalizeError(error: unknown, route?: string): SafeRequestError {
  if (error instanceof SafeRequestException) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      route: error.route ?? route,
      cause: error.cause,
    };
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return { message: "Request timed out", code: "TIMEOUT", route, cause: error };
  }
  if (error instanceof Error) {
    return {
      message: error.message || "Request failed",
      code: "REQUEST_FAILED",
      route,
      cause: error,
    };
  }
  return {
    message: String(error ?? "Request failed"),
    code: "REQUEST_FAILED",
    route,
    cause: error,
  };
}

export function logDataLoadFailure(
  route: string,
  error: unknown,
  details?: Record<string, unknown>,
) {
  const normalized = normalizeError(error, route);
  console.error("[data-load-failed]", {
    route,
    code: normalized.code,
    status: normalized.status,
    message: normalized.message,
    ...details,
  });
}

export async function safeFetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number; route?: string } = {},
): Promise<SafeRequestResult<T>> {
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const route = init.route ?? (typeof input === "string" ? input : input.toString());

  try {
    const response = await fetch(input, { ...init, signal: init.signal ?? controller.signal });
    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json().catch(() => null)
      : await response.text().catch(() => "");

    if (!response.ok) {
      const message =
        typeof payload === "object" && payload && "error" in payload
          ? String((payload as { error?: unknown }).error ?? response.statusText)
          : response.statusText || `Request failed with ${response.status}`;
      return {
        ok: false,
        status: response.status,
        error: {
          message,
          code: `HTTP_${response.status}`,
          status: response.status,
          route,
          cause: payload,
        },
      };
    }

    return { ok: true, status: response.status, data: payload as T };
  } catch (error) {
    const normalized = normalizeError(error, route);
    logDataLoadFailure(route, normalized);
    return { ok: false, status: normalized.status ?? 0, error: normalized };
  } finally {
    clearTimeout(id);
  }
}

export async function safeQuery<T>(route: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    const data = await fn();
    return data ?? fallback;
  } catch (error) {
    logDataLoadFailure(route, error);
    return fallback;
  }
}
