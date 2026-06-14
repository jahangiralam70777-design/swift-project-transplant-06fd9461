import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAppStore } from "@/stores/app-store";
import { safeQuery } from "@/lib/safe-request";
import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/admin-notifications.functions";

export type MyNotification = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  type: "announcement" | "push" | "email" | "in_app";
  priority: "low" | "medium" | "high" | "critical";
  sent_at: string | null;
  created_at: string;
  read: boolean;
};

export const MY_NOTIF_KEY = ["my-notifications"] as const;

export function useMyNotifications(enabledOpt = true) {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyNotifications);
  const markFn = useServerFn(markNotificationRead);
  const markAllFn = useServerFn(markAllNotificationsRead);
  const sessionReady = useAppStore((s) => s.sessionReady);
  const authLoading = useAppStore((s) => s.authLoading);
  const user = useAppStore((s) => s.user);
  const enabled =
    enabledOpt && sessionReady && !authLoading && !!user && !user.id.startsWith("demo-");

  const q = useQuery({
    queryKey: MY_NOTIF_KEY,
    queryFn: () => safeQuery<MyNotification[]>("my-notifications", () => listFn() as Promise<MyNotification[]>, []),
    enabled,
    staleTime: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markFn({ data: { id } }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: MY_NOTIF_KEY });
      const prev = qc.getQueryData<MyNotification[]>(MY_NOTIF_KEY);
      qc.setQueryData<MyNotification[]>(MY_NOTIF_KEY, (old) =>
        (old ?? []).map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(MY_NOTIF_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: MY_NOTIF_KEY }),
  });

  const markAll = useMutation({
    mutationFn: () => markAllFn(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: MY_NOTIF_KEY });
      const prev = qc.getQueryData<MyNotification[]>(MY_NOTIF_KEY);
      qc.setQueryData<MyNotification[]>(MY_NOTIF_KEY, (old) =>
        (old ?? []).map((n) => ({ ...n, read: true })),
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(MY_NOTIF_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: MY_NOTIF_KEY }),
  });

  const items = q.data ?? [];
  const unread = items.filter((n) => !n.read).length;

  return { items, unread, isLoading: q.isLoading, markRead, markAll };
}
