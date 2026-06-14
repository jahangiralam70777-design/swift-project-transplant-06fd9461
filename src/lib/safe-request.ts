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

const DEFAULT_TIMEOUT_MS = 12_000;
const FAILURE_LOG_DEDUPE_MS = 5_000;
const recentFailureLogs = new Map<string, number>();

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function getErrorMessage(error: unknown): string | undefined {
  if (error instanceof Error) return error.message;
  if (isObject(error) && typeof error.message === "string") return error.message;
  if (isObject(error) && typeof error.error_description === "string") return error.error_description;
  return undefined;
}

function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof SafeRequestException) return error.status;
  if (isObject(error) && typeof error.status === "number") return error.status;
  if (isObject(error) && typeof error.statusCode === "number") return error.statusCode;
  return undefined;
}

function getErrorCode(error: unknown): string | undefined {
  if (error instanceof SafeRequestException) return error.code;
  if (isObject(error) && typeof error.code === "string") return error.code;
  if (isObject(error) && typeof error.name === "string") return error.name;
  return undefined;
}

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
    return {
      message: "Request timed out",
      code: "TIMEOUT",
      route,
      cause: error,
    };
  }
  if (error instanceof Error) {
    return {
      message: error.message || "Request failed",
      code: getErrorCode(error) ?? "REQUEST_FAILED",
      status: getErrorStatus(error),
      route,
      cause: error,
    };
  }
  const objectMessage = getErrorMessage(error);
  if (objectMessage) {
    return {
      message: objectMessage,
      code: getErrorCode(error) ?? "REQUEST_FAILED",
      status: getErrorStatus(error),
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
  const key = `${route}|${normalized.code}|${normalized.status ?? ""}|${normalized.message}`;
  const now = Date.now();
  const last = recentFailureLogs.get(key) ?? 0;
  if (now - last < FAILURE_LOG_DEDUPE_MS) return;
  recentFailureLogs.set(key, now);
  if (recentFailureLogs.size > 250) {
    const cutoff = now - FAILURE_LOG_DEDUPE_MS;
    for (const [k, t] of recentFailureLogs) if (t < cutoff) recentFailureLogs.delete(k);
  }
  console.error("[data-load-failed]", {
    route,
    code: normalized.code,
    status: normalized.status,
    message: normalized.message,
    ...details,
  });
}

function timeoutError(route?: string): SafeRequestException {
  return new SafeRequestException({
    message: "Request timed out",
    code: "TIMEOUT",
    route,
  });
}

function mergeAbortSignals(timeoutSignal: AbortSignal, external?: AbortSignal): AbortSignal {
  if (!external) return timeoutSignal;
  if (external.aborted) return external;
  const controller = new AbortController();
  const abort = () => controller.abort();
  timeoutSignal.addEventListener("abort", abort, { once: true });
  external.addEventListener("abort", abort, { once: true });
  return controller.signal;
}

export async function withTimeout<T>(
  route: string,
  fn: () => Promise<T>,
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  let id: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        id = setTimeout(() => reject(timeoutError(route)), timeoutMs);
      }),
    ]);
  } finally {
    if (id) clearTimeout(id);
  }
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
    const response = await fetch(input, {
      ...init,
      signal: mergeAbortSignals(controller.signal, init.signal ?? undefined),
    });
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

export async function safeQuery<T>(
  route: string,
  fn: () => Promise<T>,
  fallback: T,
  options: { timeoutMs?: number; retries?: number } = {},
): Promise<T> {
  const retries = options.retries ?? 1;
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const data = await withTimeout(route, fn, options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      return data ?? fallback;
    } catch (error) {
      lastError = error;
      if (attempt < retries) continue;
    }
  }
  logDataLoadFailure(route, lastError);
  return fallback;
}
