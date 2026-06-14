import { createFileRoute } from "@tanstack/react-router";
import { BookmarksFlow } from "@/components/dashboard/BookmarksFlow";
import { StudentRouteBoundary } from "@/components/dashboard/StudentRouteBoundary";

export const Route = createFileRoute("/_student/bookmarks")({
  component: () => (
    <StudentRouteBoundary name="student:bookmarks">
      <BookmarksFlow />
    </StudentRouteBoundary>
  ),
  head: () => ({
    meta: [{ title: "Bookmarks · CA Aspire BD" }],
  }),
});
