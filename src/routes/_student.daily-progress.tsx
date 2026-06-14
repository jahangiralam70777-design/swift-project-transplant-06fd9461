import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StudentRouteBoundary } from "@/components/dashboard/StudentRouteBoundary";

const DailyProgressCenter = lazy(() =>
  import("@/components/dashboard/DailyProgressCenter").then((m) => ({
    default: m.DailyProgressCenter,
  })),
);

export const Route = createFileRoute("/_student/daily-progress")({
  component: DailyProgressPage,
  head: () => ({
    meta: [
      { title: "Daily Progress · CA Aspire BD" },
      {
        name: "description",
        content:
          "Track daily, weekly and monthly study progress across subjects and chapters with live analytics.",
      },
    ],
  }),
});

function DailyProgressPage() {
  return (
    <StudentRouteBoundary name="student:daily-progress">
      <Suspense fallback={<Skeleton className="h-[60vh] w-full rounded-3xl" />}>
        <DailyProgressCenter />
      </Suspense>
    </StudentRouteBoundary>
  );
}
