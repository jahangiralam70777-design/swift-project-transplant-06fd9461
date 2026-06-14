import { createFileRoute } from "@tanstack/react-router";
import { NotificationsFlow } from "@/components/dashboard/NotificationsFlow";
import { StudentRouteBoundary } from "@/components/dashboard/StudentRouteBoundary";

export const Route = createFileRoute("/_student/notifications")({
  component: NotificationsPage,
  head: () => ({
    meta: [
      { title: "Notifications Center · CA Aspire BD" },
      {
        name: "description",
        content:
          "Stay updated with exams, announcements, results and learning activities in your premium glass notifications center.",
      },
      { property: "og:title", content: "Notifications Center · CA Aspire BD" },
      {
        property: "og:description",
        content:
          "Glassmorphism notifications hub with filters, activity timeline, pinned alerts and quick actions.",
      },
    ],
  }),
});

function NotificationsPage() {
  return (
    <StudentRouteBoundary name="student:notifications">
      <NotificationsFlow />
    </StudentRouteBoundary>
  );
}
