"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { remindersApi } from "@/services/api/reminders.api";
import { ROUTES } from "@/constants/routes";
import { usePermissions } from "@/hooks/use-permissions";

const STORAGE_KEY = "shownReminderIds";

function getShownIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function markShown(ids: string[]) {
  const shown = getShownIds();
  ids.forEach((id) => shown.add(id));
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...shown]));
}

const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

export function ReminderToasts() {
  const router = useRouter();
  const { canRead } = usePermissions();

  const { data } = useQuery({
    queryKey: ["reminders", "my", "toasts"],
    queryFn: () =>
      remindersApi.getMy({
        status: "pending",
        limit: 20,
        sort: "reminder_date",
      }),
    enabled: canRead("reminders"),
  });

  useEffect(() => {
    if (!data?.data?.length) return;

    const now = new Date();
    now.setHours(23, 59, 59, 999);

    const shown = getShownIds();
    const due = data.data
      .filter((r) => {
        if (shown.has(r._id)) return false;
        const dueDate = new Date(r.reminder_date);
        return dueDate <= now;
      })
      .sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 9) -
          (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 9)
      )
      .slice(0, 3);

    if (!due.length) return;

    due.forEach((reminder) => {
      toast(reminder.title, {
        description: reminder.description ?? `Due ${reminder.reminder_date}`,
        duration: 8000,
        action: {
          label: "View",
          onClick: () => router.push(`${ROUTES.reminders}?id=${reminder._id}`),
        },
      });
    });

    markShown(due.map((r) => r._id));
  }, [data, router]);

  return null;
}
