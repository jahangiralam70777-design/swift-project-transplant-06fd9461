/**
 * Admin dashboard service — composes admin overview repository calls.
 */
import { AdminDashboard } from "@/lib/repositories";

export type AdminDashboardSnapshot = Awaited<ReturnType<typeof AdminDashboard.adminDashboardSnapshot>>;
export type AdminControlCenter = Awaited<ReturnType<typeof AdminDashboard.adminControlCenter>>;
export type AdminPremiumOverview = Awaited<ReturnType<typeof AdminDashboard.adminPremiumOverview>>;
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

export const FALLBACK_ADMIN_PREMIUM_OVERVIEW: AdminPremiumOverview = {
  kpi: {
    active_students: 0,
    active_students_delta_pct: 0,
    live_exams: 0,
    live_exams_delta_pct: 0,
    tests_completed: 0,
    tests_completed_delta_pct: 0,
    questions_in_bank: 0,
    questions_in_bank_delta_pct: 0,
    active_sessions: 0,
    active_sessions_delta_pct: 0,
    new_registrations: 0,
    new_registrations_delta_pct: 0,
  },
  platform_overview: [],
  platform_overview_total: 0,
  platform_overview_delta_pct: 0,
  devices: [],
  browsers: [],
  top_subjects: [],
  exam_participation: { invited: 0, joined: 0, rate_pct: 0 },
  engagement: { dau_today: 0, delta_pct: 0, series: [] },
  system: {
    uptime_pct: 100,
    server_time_iso: new Date(0).toISOString(),
    health: [],
    api_errors_24h: 0,
  },
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
