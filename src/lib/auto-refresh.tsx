import { useEffect, useRef } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "@tanstack/react-router";
import { RefreshCw, Radio } from "lucide-react";

/**
 * Global auto-refresh system.
 *
 * Strategy by route tier:
 *   - critical (admin, analytics, live dashboards): 20s background poll
 *   - normal   (student dashboards, lists):         120s background poll
 *   - static   (marketing, legal, auth pages):      focus-only, no polling
 *
 * Plus, every tier refreshes when:
 *   - the tab regains focus (debounced)
 *   - the page becomes visible
 *   - the route changes
 *
 * All work goes through React Query's invalidateQueries — no full reloads,
 * no per-component intervals to leak, no overlapping requests (Query
 * dedupes in-flight fetches by key).
 */

export type RefreshTier = "critical" | "normal" | "static";

const TIER_INTERVAL_MS: Record<RefreshTier, number | null> = {
  critical: 20_000,
  normal: 120_000,
  static: null,
};

const TIER_LABEL: Record<RefreshTier, string> = {
  critical: "Live",
  normal: "Auto",
  static: "Static",
};

const CRITICAL_PREFIXES = ["/admin"];
const STATIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/email-verified",
  "/admin/login",
  "/terms",
  "/privacy",
  "/cookies",
  "/security",
]);
const STATIC_PREFIXES = ["/blog"];

export function getRefreshTier(pathname: string): RefreshTier {
  if (CRITICAL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return "critical";
  }
  if (STATIC_PATHS.has(pathname)) return "static";
  if (STATIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "static";
  return "normal";
}

/**
 * Mount once at the app shell. Drives focus/visibility + interval refresh
 * for the current route's tier. Safe to render on every render; effects
 * own their own cleanup so no duplicate intervals or listeners are created.
 */
export function AutoRefreshController() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const pathname = location.pathname;
  const tier = getRefreshTier(pathname);
  const lastRefreshRef = useRef(0);

  // Throttled refresh — collapses bursts (focus + visibility firing together)
  // and prevents overlapping invalidations within a 2s window.
  const refresh = (reason: string) => {
    const now = Date.now();
    if (now - lastRefreshRef.current < 2000) return;
    lastRefreshRef.current = now;
    void queryClient.invalidateQueries({ type: "active" });
    if (typeof console !== "undefined") {
      console.debug("[auto-refresh]", { reason, tier, pathname });
    }
  };

  // Background polling per tier. Cleared on tier/path change or unmount.
  useEffect(() => {
    const interval = TIER_INTERVAL_MS[tier];
    if (!interval) return;
    const id = window.setInterval(() => {
      // Skip polling while the tab is hidden — saves API quota and avoids
      // a stampede when the user returns (focus handler will refresh once).
      if (document.visibilityState !== "visible") return;
      refresh("interval");
    }, interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, pathname]);

  // Focus / visibility / online refresh — all tiers.
  useEffect(() => {
    const onFocus = () => refresh("focus");
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh("visibility");
    };
    const onOnline = () => refresh("online");
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Route-change refresh (excluding the very first mount — initial loaders
  // already fetched).
  const isFirstPath = useRef(true);
  useEffect(() => {
    if (isFirstPath.current) {
      isFirstPath.current = false;
      return;
    }
    refresh("route-change");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}

/**
 * Subtle pill in the corner: shows the tier label and pulses while any
 * query is fetching. Non-blocking, ignores pointer events, hides on
 * the static tier so marketing pages stay clean.
 */
export function LiveIndicator() {
  const location = useLocation();
  const tier = getRefreshTier(location.pathname);
  const fetching = useIsFetching();

  if (tier === "static") return null;

  const label = fetching > 0 ? "Updating…" : TIER_LABEL[tier];
  const Icon = fetching > 0 ? RefreshCw : Radio;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-3 left-3 z-40 flex items-center gap-1.5 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm"
    >
      <Icon
        className={`h-3 w-3 ${fetching > 0 ? "animate-spin text-primary" : tier === "critical" ? "text-emerald-500" : "text-muted-foreground"}`}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}