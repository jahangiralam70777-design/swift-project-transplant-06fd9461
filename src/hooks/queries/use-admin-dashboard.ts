/**
 * Admin dashboard hooks.
 */
import { queryOptions } from "@tanstack/react-query";
import * as AdminDashboardService from "@/lib/services/admin-dashboard.service";
import { useSafeQuery } from "@/lib/safe-query";

export const adminDashboardQueries = {
  snapshot: () =>
    queryOptions({
      queryKey: ["admin", "dashboard", "snapshot"] as const,
      queryFn: () => AdminDashboardService.getDashboardSnapshot(),
    }),
  controlCenter: () =>
    queryOptions({
      queryKey: ["admin", "dashboard", "control-center"] as const,
      queryFn: () => AdminDashboardService.getControlCenter(),
    }),
  notificationsBadge: () =>
    queryOptions({
      queryKey: ["admin", "notifications", "badge"] as const,
      queryFn: () => AdminDashboardService.getNotificationsBadge(),
    }),
};

export const useAdminDashboardSnapshot = () =>
  useSafeQuery({
    queryKey: ["admin", "dashboard", "snapshot"] as const,
    queryFn: () => AdminDashboardService.getDashboardSnapshot(),
    fallbackData: AdminDashboardService.FALLBACK_ADMIN_DASHBOARD,
    route: "admin/dashboard/snapshot",
  });
export const useAdminControlCenter = () =>
  useSafeQuery({
    queryKey: ["admin", "dashboard", "control-center"] as const,
    queryFn: () => AdminDashboardService.getControlCenter(),
    fallbackData: AdminDashboardService.FALLBACK_ADMIN_CONTROL_CENTER,
    route: "admin/dashboard/control-center",
  });
export const useAdminNotificationsBadge = () =>
  useSafeQuery({
    queryKey: ["admin", "notifications", "badge"] as const,
    queryFn: () => AdminDashboardService.getNotificationsBadge(),
    fallbackData: AdminDashboardService.FALLBACK_ADMIN_NOTIFICATIONS_BADGE,
    route: "admin/notifications/badge",
  });
