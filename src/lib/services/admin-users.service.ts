/**
 * Admin users service — composes admin user management repository calls.
 */
import { AdminUsers } from "@/lib/repositories";

export type AdminUserListResult = Awaited<ReturnType<typeof AdminUsers.adminListUsers>>;
export type AdminUserStats = Awaited<ReturnType<typeof AdminUsers.adminUserStats>>;
export type AdminReferralStats = Awaited<ReturnType<typeof AdminUsers.adminReferralStats>>;

export const FALLBACK_ADMIN_USER_LIST: AdminUserListResult = {
  rows: [],
  count: 0,
  page: 1,
  pageSize: 25,
};

export const FALLBACK_ADMIN_USER_STATS: AdminUserStats = {
  total: 0,
  active: 0,
  suspended: 0,
  pending: 0,
  admins: 0,
  verified: 0,
};

export const FALLBACK_ADMIN_REFERRAL_STATS: AdminReferralStats = {
  sources: [],
  unknown: 0,
  total: 0,
};

export interface ListUsersFilters {
  search?: string;
  role?: "admin" | "moderator" | "student";
  status?: "active" | "suspended" | "pending" | "deleted";
  level?: string;
  referralSource?: string;
  dateRange?: "24h" | "7d" | "30d" | "lifetime";
  includeDeleted?: boolean;
  verified?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listUsers(filters: ListUsersFilters = {}): Promise<AdminUserListResult> {
  return AdminUsers.adminListUsers({
    data: { page: 1, pageSize: 25, ...filters },
  });
}

export async function getUserStats(): Promise<AdminUserStats> {
  return AdminUsers.adminUserStats();
}

export async function getReferralStats(): Promise<AdminReferralStats> {
  return AdminUsers.adminReferralStats();
}
