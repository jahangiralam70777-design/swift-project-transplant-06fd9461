/**
 * Admin dashboard service — composes admin overview repository calls.
 */
import { AdminDashboard } from "@/lib/repositories";

export type AdminDashboardSnapshot = Awaited<ReturnType<typeof AdminDashboard.adminDashboardSnapshot>>;
export type AdminControlCenter = Awaited<ReturnType<typeof AdminDashboard.adminControlCenter>>;
export type AdminNotificationsBadge = Awaited<ReturnType<typeof AdminDashboard.adminNotificationsBadge>>;

export const FALLBACK_ADMIN_DASHBOARD: AdminDashboardSnapshot = {
  counters: {
    activeStudents: 0,
    totalStudents: 0,
    liveExams: 0,
    pendingDrafts: 0,
    recentUploads24h: 0,
    scheduledNotifications: 0,
  },
  recentUploads: [],
  recentNotifications: [],
};

export const FALLBACK_ADMIN_CONTROL_CENTER: AdminControlCenter = {
  users: {
    total_students: 0,
    total_admins: 0,
    active_now: 0,
    active_24h: 0,
    active_7d: 0,
    active_30d: 0,
    lifetime_active: 0,
    total_logins: 0,
    avg_session_seconds: 0,
  },
  traffic: {
    page_views_24h: 0,
    clicks_24h: 0,
    submits_24h: 0,
    total_events_24h: 0,
    sessions_24h: 0,
    api_errors_24h: 0,
  },
  modules: [],
  growth_series: [],
  login_series: [],
  module_usage_series: [],
  top_users: [],
  top_features: [],
  recent_activity: [],
};

export const FALLBACK_ADMIN_NOTIFICATIONS_BADGE: AdminNotificationsBadge = {
  unread: 0,
  scheduled: 0,
  recent: [],
};

export async function getDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  return AdminDashboard.adminDashboardSnapshot();
}

export async function getControlCenter(): Promise<AdminControlCenter> {
  return AdminDashboard.adminControlCenter();
}

export async function getNotificationsBadge(): Promise<AdminNotificationsBadge> {
  return AdminDashboard.adminNotificationsBadge();
}
