/**
 * Student dashboard service — composes student-facing dashboard repository calls.
 */
import { StudentDashboard } from "@/lib/repositories";

export type StudentDashboardData = Awaited<ReturnType<typeof StudentDashboard.studentDashboardSnapshot>>;

export const FALLBACK_STUDENT_DASHBOARD: StudentDashboardData = {
  counts: {
    mcqs: 0,
    mcqsThisWeek: 0,
    quizzes: 0,
    quizzesThisWeek: 0,
    mocks: 0,
    mocksThisWeek: 0,
    notes: 0,
    classes: 0,
    attempts: 0,
  },
  accuracy: 0,
  streak: 0,
  bars: [0, 0, 0, 0, 0, 0, 0],
  subjects: [],
  learning: [],
  recommendations: [],
  notifications: [],
  upcomingMock: null,
  recentActivity: [],
};

export async function getDashboardSnapshot(): Promise<StudentDashboardData> {
  return StudentDashboard.studentDashboardSnapshot();
}
