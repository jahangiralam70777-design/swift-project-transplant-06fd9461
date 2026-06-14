import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listModuleVisibility,
  type ModuleKey,
  type ModuleVisibilityRow,
} from "@/lib/module-visibility.functions";
import { safeQuery } from "@/lib/safe-request";

export type { ModuleKey } from "@/lib/module-visibility.functions";

/** Path → module key. Routes not listed are never hidden. */
export const MODULE_BY_PATH: Record<string, ModuleKey> = {
  "/mcq-practice": "mcq_practice",
  "/quiz": "quiz",
  "/mock-test": "mock_test",
  "/flash-cards": "flash_cards",
  "/short-notes": "short_notes",
  "/qns-bank": "qns_bank",
  "/classes": "classes",
};

/** Landing-feature title → module key (for hiding cards on the marketing site). */
export const MODULE_BY_FEATURE_TITLE: Record<string, ModuleKey> = {
  "MCQ Practice": "mcq_practice",
  "Quiz System": "quiz",
  "Mock Test": "mock_test",
  "Flash Cards": "flash_cards",
  "Short Notes": "short_notes",
  "Qns Bank": "qns_bank",
  "Video Classes": "classes",
};

export function useModuleVisibility() {
  const listFn = useServerFn(listModuleVisibility);
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["module-visibility"],
    queryFn: () => safeQuery<ModuleVisibilityRow[]>("module-visibility", () => listFn(), []),
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });

  // Realtime: re-fetch the student menu the moment an admin toggles a module.
  useEffect(() => {
    const channel = supabase
      .channel("module-visibility-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "module_visibility" }, () =>
        qc.invalidateQueries({ queryKey: ["module-visibility"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const hiddenSet = useMemo(() => {
    const s = new Set<ModuleKey>();
    (query.data ?? []).forEach((r: ModuleVisibilityRow) => {
      if (r.hidden) s.add(r.key);
    });
    return s;
  }, [query.data]);

  return {
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isHidden: (key?: ModuleKey | null) => (key ? hiddenSet.has(key) : false),
    isPathHidden: (path: string) => {
      const k = MODULE_BY_PATH[path];
      return k ? hiddenSet.has(k) : false;
    },
  };
}
