import { Suspense, type ReactNode } from "react";
import { SectionBoundary, SectionSkeleton } from "@/components/ui/section-state";

export function StudentRouteBoundary({
  name,
  children,
}: {
  name: string;
  children: ReactNode;
}) {
  return (
    <SectionBoundary name={name} className="min-h-[40vh]">
      <Suspense fallback={<SectionSkeleton className="min-h-[60vh] rounded-3xl" />}>
        {children}
      </Suspense>
    </SectionBoundary>
  );
}