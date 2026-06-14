/**
 * Admin users hooks.
 */
import { queryOptions } from "@tanstack/react-query";
import * as AdminUsersService from "@/lib/services/admin-users.service";
import type { ListUsersFilters } from "@/lib/services/admin-users.service";
import { useSafeQuery } from "@/lib/safe-query";

export const adminUsersQueries = {
  list: (filters: ListUsersFilters = {}) =>
    queryOptions({
      queryKey: ["admin", "users", "list", filters] as const,
      queryFn: () => AdminUsersService.listUsers(filters),
    }),
  stats: () =>
    queryOptions({
      queryKey: ["admin", "users", "stats"] as const,
      queryFn: () => AdminUsersService.getUserStats(),
    }),
  referralStats: () =>
    queryOptions({
      queryKey: ["admin", "users", "referrals"] as const,
      queryFn: () => AdminUsersService.getReferralStats(),
    }),
};

export const useAdminUsersList = (filters: ListUsersFilters = {}) =>
  useSafeQuery({
    queryKey: ["admin", "users", "list", filters] as const,
    queryFn: () => AdminUsersService.listUsers(filters),
    fallbackData: { ...AdminUsersService.FALLBACK_ADMIN_USER_LIST, page: filters.page ?? 1, pageSize: filters.pageSize ?? 25 },
    route: "admin/users/list",
  });
export const useAdminUserStats = () =>
  useSafeQuery({
    queryKey: ["admin", "users", "stats"] as const,
    queryFn: () => AdminUsersService.getUserStats(),
    fallbackData: AdminUsersService.FALLBACK_ADMIN_USER_STATS,
    route: "admin/users/stats",
  });
export const useAdminReferralStats = () =>
  useSafeQuery({
    queryKey: ["admin", "users", "referrals"] as const,
    queryFn: () => AdminUsersService.getReferralStats(),
    fallbackData: AdminUsersService.FALLBACK_ADMIN_REFERRAL_STATS,
    route: "admin/users/referrals",
  });
