/**
 * Student dashboard hooks.
 */
import { queryOptions } from "@tanstack/react-query";
import * as StudentDashboardService from "@/lib/services/student-dashboard.service";
import { useSafeQuery } from "@/lib/safe-query";

export const studentDashboardQueries = {
  snapshot: () =>
    queryOptions({
      queryKey: ["student", "dashboard", "snapshot"] as const,
      queryFn: () => StudentDashboardService.getDashboardSnapshot(),
    }),
};

export const useStudentDashboardSnapshot = () =>
  useSafeQuery({
    ...studentDashboardQueries.snapshot(),
    fallbackData: StudentDashboardService.FALLBACK_STUDENT_DASHBOARD,
    route: "student/dashboard/snapshot",
  });
