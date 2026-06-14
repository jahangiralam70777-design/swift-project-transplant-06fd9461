import { createFileRoute } from "@tanstack/react-router";
import { WrongQuestionsFlow } from "@/components/dashboard/WrongQuestionsFlow";
import { StudentRouteBoundary } from "@/components/dashboard/StudentRouteBoundary";

export const Route = createFileRoute("/_student/wrong-questions")({
  component: () => (
    <StudentRouteBoundary name="student:wrong-questions">
      <WrongQuestionsFlow />
    </StudentRouteBoundary>
  ),
  head: () => ({
    meta: [{ title: "Wrong Questions · CA Aspire BD" }],
  }),
});
