import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { isTransientError } from "@/lib/error-classify";
import { logDataLoadFailure } from "@/lib/safe-request";
import {
  DefaultErrorFallback,
  DefaultNotFoundFallback,
  DefaultPendingFallback,
} from "./components/route-fallbacks";

export const getRouter = () => {
  const queryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        logDataLoadFailure(String(query.queryKey.join("/")), error, { queryKey: query.queryKey });
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _context, mutation) => {
        logDataLoadFailure("mutation", error, { mutationKey: mutation.options.mutationKey });
      },
    }),
    defaultOptions: {
      queries: {
        // Reuse cached data across navigations — keeps page switches instant.
        staleTime: 60_000,
        gcTime: 5 * 60_000,
        // AutoRefreshController owns focus/reconnect/visibility refresh
        // globally (see src/lib/auto-refresh.tsx). Query's own listeners
        // stay off so we don't double-fire when both trigger together.
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        // Auto-retry only transient failures (network/timeout/5xx/rate-limit).
        // Auth and not-found failures fail fast — retrying won't help.
        retry: (failureCount, error) => failureCount < 2 && isTransientError(error),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        throwOnError: false,
      },
      mutations: {
        retry: (failureCount, error) => failureCount < 1 && isTransientError(error),
        throwOnError: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 30,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorFallback,
    defaultNotFoundComponent: DefaultNotFoundFallback,
    defaultPendingComponent: DefaultPendingFallback,
    // Never flash a pending UI during navigation — keep the previous page
    // visible until the next route is ready.
    defaultPendingMs: 10_000,
    defaultPendingMinMs: 0,
  });

  return router;
};
