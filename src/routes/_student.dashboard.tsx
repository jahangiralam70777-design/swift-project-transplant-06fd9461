import { createFileRoute } from "@tanstack/react-router";
import { DashContent } from "@/components/dashboard/DashContent";
import { StudentRouteBoundary } from "@/components/dashboard/StudentRouteBoundary";

export const Route = createFileRoute("/_student/dashboard")({
  component: DashboardPage,
  head: () => ({
    meta: [
      { title: "Dashboard · CA Aspire BD" },
      {
        name: "description",
        content:
          "Your personalized learning dashboard — MCQs, quizzes, mock tests, analytics and more.",
      },
    ],
  }),
});

function DashboardPage() {
  return (
    <StudentRouteBoundary name="student:dashboard">
      <DashContent />
    </StudentRouteBoundary>
  );
}
