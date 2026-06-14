import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getAuthControls, type AuthControls } from "@/lib/auth-controls.functions";
import { useSafeQuery } from "@/lib/safe-query";

const QUERY_KEY = ["auth-controls"] as const;

export function useAuthControls() {
  const fetchFn = useServerFn(getAuthControls);
  const qc = useQueryClient();

  const query = useSafeQuery<AuthControls>({
    queryKey: QUERY_KEY,
    queryFn: () => fetchFn(),
    fallbackData: {
      id: 1,
      login_enabled: true,
      signup_enabled: true,
      login_message_title: "System Maintenance",
      login_message_subtitle: "Login Temporarily Disabled",
      login_message_description: "Login is temporarily unavailable. Please try again later.",
      login_message_footer: "Please check back later.",
      signup_message_title: "System Maintenance",
      signup_message_subtitle: "Signup Temporarily Disabled",
      signup_message_description: "New registrations are temporarily unavailable. Please try again later.",
      signup_message_footer: "Please check back later.",
      login_auto_enable_at: null,
      signup_auto_enable_at: null,
      updated_by: null,
      updated_at: new Date(0).toISOString(),
      created_at: new Date(0).toISOString(),
    },
    route: "auth-controls",
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const channel = supabase
      .channel("auth-controls-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "auth_access_controls" },
        () => {
          qc.invalidateQueries({ queryKey: QUERY_KEY });
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);

  // Also refresh roughly when the next auto-enable timestamp passes,
  // so the maintenance screen flips to the live form without manual reload.
  useEffect(() => {
    const data = query.data;
    if (!data) return;
    const next = [data.login_auto_enable_at, data.signup_auto_enable_at]
      .filter(Boolean)
      .map((t) => new Date(t as string).getTime())
      .filter((t) => t > Date.now())
      .sort()[0];
    if (!next) return;
    const delay = Math.min(next - Date.now() + 500, 2_147_483_000);
    const id = window.setTimeout(() => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    }, Math.max(delay, 1000));
    return () => window.clearTimeout(id);
  }, [query.data, qc]);

  return query;
}