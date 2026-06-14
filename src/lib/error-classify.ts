/**
 * Classify a thrown Error into a user-friendly category with actionable copy.
 * Keeps technical details out of the UI; details remain available via
 * `console.error` and `reportError` for the team.
 */
export type ErrorKind = "network" | "auth" | "notfound" | "ratelimit" | "server" | "timeout" | "unknown";

export type ClassifiedError = {
  kind: ErrorKind;
  title: string;
  message: string;
};

export function classifyError(error: unknown, scope = "page"): ClassifiedError {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  const msg = raw.toLowerCase();

  // Offline / network
  if (
    (typeof navigator !== "undefined" && navigator.onLine === false) ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("network request failed") ||
    msg.includes("load failed")
  ) {
    return {
      kind: "network",
      title: "You appear to be offline",
      message: `We couldn't reach the server to load this ${scope}. Check your internet connection and try again.`,
    };
  }

  // Timeout
  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("aborted")) {
    return {
      kind: "timeout",
      title: "This is taking longer than expected",
      message: `The ${scope} took too long to respond. Please try again in a moment.`,
    };
  }

  // Auth / permission
  if (
    msg.includes("unauthorized") ||
    msg.includes("permission denied") ||
    msg.includes("forbidden") ||
    msg.includes("not allowed") ||
    msg.includes("jwt") ||
    msg.includes("row-level security") ||
    msg.includes("rls")
  ) {
    return {
      kind: "auth",
      title: "You don't have access to this",
      message:
        "Your session may have expired or you don't have permission to view this. Please sign in again, or contact an admin if you believe this is a mistake.",
    };
  }

  // Not found
  if (msg.includes("not found") || msg.includes("404") || msg.includes("no rows")) {
    return {
      kind: "notfound",
      title: "We couldn't find that",
      message: `This ${scope} no longer exists or was moved. Try going back and reopening it from the list.`,
    };
  }

  // Rate limit
  if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("429")) {
    return {
      kind: "ratelimit",
      title: "Too many requests",
      message: "Please wait a few seconds and try again.",
    };
  }

  // Server / unknown
  if (msg.includes("500") || msg.includes("internal server")) {
    return {
      kind: "server",
      title: "Our server hit a snag",
      message: `We couldn't load this ${scope} right now. The team has been notified — please try again shortly.`,
    };
  }

  return {
    kind: "unknown",
    title: "This section failed to load",
    message: `Try again. The rest of the page is still available.`,
  };
}

/**
 * Whether the given error is likely transient and worth auto-retrying.
 * Auth/notfound failures will not recover from a blind retry.
 */
export function isTransientError(error: unknown): boolean {
  const { kind } = classifyError(error);
  return kind === "network" || kind === "timeout" || kind === "server" || kind === "ratelimit";
}
