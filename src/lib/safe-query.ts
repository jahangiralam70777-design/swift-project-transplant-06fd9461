import { keepPreviousData, type UseQueryOptions, type UseQueryResult, useQuery } from "@tanstack/react-query";
import { safeQuery } from "@/lib/safe-request";

type SafeQueryOptions<TData> = Omit<UseQueryOptions<TData, Error, TData, readonly unknown[]>, "queryFn"> & {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
  fallbackData: TData;
  route?: string;
  timeoutMs?: number;
  retries?: number;
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
  const { queryFn, fallbackData, route, timeoutMs, retries, ...queryOptions } = options;
  return useQuery({
    ...queryOptions,
    placeholderData: queryOptions.placeholderData ?? keepPreviousData,
    queryFn: () =>
      safeQuery(route ?? safeQueryKeyRoute(queryOptions.queryKey), queryFn, fallbackData, {
        timeoutMs,
        retries,
      }),
  });
}
