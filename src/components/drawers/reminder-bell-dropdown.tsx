"use client";

import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { remindersApi } from "@/services/api/reminders.api";
import { useNotificationStore } from "@/store/notification.store";
import { usePermissions } from "@/hooks/use-permissions";
import { ROUTES } from "@/constants/routes";
import { formatDate, formatLabel } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ReminderBellDropdown() {
  const { canRead } = usePermissions();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const { data } = useQuery({
    queryKey: ["reminders", "my", "bell"],
    queryFn: () =>
      remindersApi.getMy({
        status: "pending",
        limit: 8,
        sort: "reminder_date",
      }),
    enabled: canRead("reminders"),
    refetchInterval: 60_000,
  });

  if (!canRead("reminders")) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex size-7 items-center justify-center rounded-lg hover:bg-muted">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 px-1 text-[10px]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Reminders</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {data?.data?.length ? (
            data.data.map((reminder) => (
              <DropdownMenuItem key={reminder._id} className="flex flex-col items-start gap-1 p-3">
                <span className="font-medium">{reminder.title}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(reminder.reminder_date)} · {formatLabel(reminder.priority)}
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <DropdownMenuItem disabled className="text-muted-foreground">
              No pending reminders
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => {
              window.location.href = ROUTES.reminders;
            }}
          >
            Open Reminder Center
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
