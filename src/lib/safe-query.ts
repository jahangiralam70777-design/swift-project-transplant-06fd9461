import { keepPreviousData, type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";
import { safeQuery } from "@/lib/safe-request";
import { useAppStore } from "@/stores/app-store";

type SafeQueryOptions<TData> = Omit<UseQueryOptions<TData, Error, TData, any>, "queryFn"> & {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
  fallbackData: TData;
  route?: string;
  timeoutMs?: number;
  retries?: number;
  requireAuth?: boolean;
};

export function safeQueryKeyRoute(queryKey: readonly unknown[]): string {
  return queryKey
    .map((part) => {
      if (typeof part === "string" || typeof part === "number" || typeof part === "boolean") {
        return String(part);
      }
      try {
        return JSON.stringify(part);
      } catch {
        return "[complex]";
      }
    })
    .join("/");
}

export function useSafeQuery<TData>(options: SafeQueryOptions<TData>): UseQueryResult<TData, Error> {
  const { queryFn, fallbackData, route, timeoutMs, retries, requireAuth, ...queryOptions } = options;
  const sessionReady = useAppStore((s) => s.sessionReady);
  const authLoading = useAppStore((s) => s.authLoading);
  const user = useAppStore((s) => s.user);
  const authEnabled = !requireAuth || (sessionReady && !authLoading && !!user?.id);
  return useQuery({
    ...queryOptions,
    enabled: authEnabled && (queryOptions.enabled ?? true),
    initialData: queryOptions.initialData ?? fallbackData,
    placeholderData: queryOptions.placeholderData ?? keepPreviousData,
    queryFn: () =>
      safeQuery(route ?? safeQueryKeyRoute(queryOptions.queryKey), queryFn, fallbackData, {
        timeoutMs,
        retries,
      }),
  });
}
