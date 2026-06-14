import { createFileRoute } from "@tanstack/react-router";
import { ShortNotesFlow } from "@/components/dashboard/ShortNotesFlow";
import { ModuleGuard } from "@/components/dashboard/ModuleGuard";
import { StudentRouteBoundary } from "@/components/dashboard/StudentRouteBoundary";

export const Route = createFileRoute("/_student/short-notes")({
  component: ShortNotesPage,
  head: () => ({
    meta: [
      { title: "Smart Short Notes · CA Aspire BD" },
      {
        name: "description",
        content:
          "Quick chapter-wise short notes for fast revision. Search, bookmark, zoom and download as PDF.",
      },
      { property: "og:title", content: "Smart Short Notes · CA Aspire BD" },
      {
        property: "og:description",
        content:
          "Premium glassmorphism reading experience with text/PDF modes, highlights and AI-recommended notes.",
      },
    ],
  }),
});

function ShortNotesPage() {
  return (
    <StudentRouteBoundary name="student:short-notes">
      <ModuleGuard moduleKey="short_notes">
        <ShortNotesFlow />
      </ModuleGuard>
    </StudentRouteBoundary>
  );
}
