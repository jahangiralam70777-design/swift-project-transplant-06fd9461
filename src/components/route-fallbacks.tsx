import { useEffect, useRef, useState } from "react";
import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { Link, useRouter } from "@tanstack/react-router";
import { AlertTriangle, RefreshCw, Wifi, ShieldAlert, Search, Clock, LifeBuoy } from "lucide-react";
import { classifyError, isTransientError, type ErrorKind } from "@/lib/error-classify";
import { logDataLoadFailure } from "@/lib/safe-request";

// Instant navigation: never render a pending fallback between routes.
// Previous page stays on screen until the next route is ready (TanStack
// Router default behavior when no pending component is shown).
export function DefaultPendingFallback() {
  return null;
}

export function DefaultNotFoundFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">We couldn't find that page</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The link may be broken or the page may have moved. Try heading back to the homepage.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

const KIND_ICON: Record<ErrorKind, typeof AlertTriangle> = {
  network: Wifi,
  timeout: Clock,
  auth: ShieldAlert,
  notfound: Search,
  ratelimit: Clock,
  server: AlertTriangle,
  unknown: AlertTriangle,
};

export function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const queryReset = useQueryErrorResetBoundary();
  const { kind, title, message } = classifyError(error, "section");
  const Icon = KIND_ICON[kind];
  const attemptsRef = useRef(0);
  const [retrying, setRetrying] = useState(false);

  // Detailed log for the team; UI shows only the friendly message.
  useEffect(() => {
    logDataLoadFailure(router.state.location.pathname, error, { boundary: "route" });
  }, [error, router]);

  const runRetry = async () => {
    setRetrying(true);
    try {
      queryReset.reset();
      await router.invalidate({ sync: true });
      reset();
    } finally {
      setRetrying(false);
    }
  };

  // Automatic retry (max 2 attempts, exponential backoff) for transient failures.
  useEffect(() => {
    if (!isTransientError(error)) return;
    if (attemptsRef.current >= 2) return;
    const delay = 600 * Math.pow(2, attemptsRef.current); // 600ms, 1200ms
    attemptsRef.current += 1;
    const id = window.setTimeout(() => {
      void runRetry();
    }, delay);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  return (
    <div role="alert" aria-live="polite" className="px-4 py-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <Icon className="h-6 w-6 text-destructive" aria-hidden />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-foreground">This section failed to load.</h2>
        <p className="mt-2 text-sm text-muted-foreground">{message || title}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={runRetry}
            disabled={retrying}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} aria-hidden />{" "}
            {retrying ? "Retrying…" : "Retry"}
          </button>
          <button
            onClick={() => router.history.back()}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Go home
          </Link>
          {(kind === "server" || kind === "unknown") && (
            <a
              href="mailto:support@edumaster.app"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden /> Contact support
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
