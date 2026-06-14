import { createFileRoute } from "@tanstack/react-router";
import { QuestionBankFlow } from "@/components/dashboard/QuestionBankFlow";
import { ModuleGuard } from "@/components/dashboard/ModuleGuard";
import { StudentRouteBoundary } from "@/components/dashboard/StudentRouteBoundary";

export const Route = createFileRoute("/_student/qns-bank")({
  component: QnsBankPage,
  head: () => ({
    meta: [
      { title: "Smart Question Bank · CA Aspire BD" },
      {
        name: "description",
        content:
          "Chapter-wise important questions, PDFs, previous-year questions and model test papers — all in one premium viewer.",
      },
      { property: "og:title", content: "Smart Question Bank · CA Aspire BD" },
      {
        property: "og:description",
        content:
          "Premium glassmorphism resource viewer with PDF/text modes, highlights and AI recommendations.",
      },
    ],
  }),
});

function QnsBankPage() {
  return (
    <StudentRouteBoundary name="student:qns-bank">
      <ModuleGuard moduleKey="qns_bank">
        <QuestionBankFlow />
      </ModuleGuard>
    </StudentRouteBoundary>
  );
}
