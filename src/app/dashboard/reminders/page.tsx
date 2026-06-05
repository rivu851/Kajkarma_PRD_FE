"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Bell, Check, Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { remindersApi } from "@/services/api/reminders.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { Reminder } from "@/types/reminder.types";
import { REMINDER_PRIORITIES, REMINDER_STATUSES } from "@/constants/enums";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DataTable } from "@/components/tables/data-table";
import { PaginationControls } from "@/components/tables/pagination-controls";
import { MetricCard } from "@/components/cards/metric-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatLabel } from "@/utils/format";
import { useAuthStore } from "@/store/auth.store";

export default function RemindersPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<"my" | "all">("my");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snoozeId, setSnoozeId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    search: search || undefined,
    status: status !== "all" ? status : undefined,
  };

  const { data: stats } = useQuery({
    queryKey: ["reminders", "stats"],
    queryFn: () => remindersApi.getStats(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["reminders", tab, params],
    queryFn: () => (tab === "my" ? remindersApi.getMy(params) : remindersApi.getAll(params)),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["reminders"] });
  };

  const readMutation = useMutation({
    mutationFn: (id: string) => remindersApi.markRead(id),
    onSuccess: () => { toast.success("Marked as read"); invalidate(); },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const doneMutation = useMutation({
    mutationFn: (id: string) => remindersApi.markDone(id),
    onSuccess: () => { toast.success("Marked as done"); invalidate(); },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remindersApi.delete(id),
    onSuccess: () => {
      toast.success("Reminder deleted");
      invalidate();
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Reminder>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => (
          <span className={row.original.is_read ? "" : "font-semibold"}>
            {row.original.title}
            {!row.original.is_read ? <Badge className="ml-2" variant="secondary">New</Badge> : null}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.type)}</Badge>,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => formatLabel(row.original.priority),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "reminder_date",
        header: "Due",
        cell: ({ row }) => formatDate(row.original.reminder_date),
      },
      {
        id: "assigned_user",
        header: "Assigned",
        cell: ({ row }) => row.original.assigned_user?.name ?? "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {!row.original.is_read ? (
              <PermissionGate module="reminders" action="update">
                <Button size="sm" variant="outline" onClick={() => readMutation.mutate(row.original._id)} disabled={readMutation.isPending}>
                  Read
                </Button>
              </PermissionGate>
            ) : null}
            {row.original.status === "pending" || row.original.status === "snoozed" ? (
              <PermissionGate module="reminders" action="update">
                <Button size="sm" variant="outline" onClick={() => doneMutation.mutate(row.original._id)} disabled={doneMutation.isPending}>
                  <Check className="mr-1 h-3 w-3" />Done
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSnoozeId(row.original._id)}>
                  <Clock className="mr-1 h-3 w-3" />Snooze
                </Button>
              </PermissionGate>
            ) : null}
            <PermissionGate module="reminders" action="delete">
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original._id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    [readMutation, doneMutation]
  );

  return (
    <ProtectedRoute module="reminders">
      <div className="space-y-6">
        <PageHeader
          title="Reminders"
          description="Track follow-ups, deadlines, and action items."
          actions={
            <PermissionGate module="reminders" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Reminder
              </Button>
            </PermissionGate>
          }
        />

        {stats ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Pending" value={stats.pendingCount} icon={Bell} />
            <MetricCard title="Overdue" value={stats.overdueCount} icon={Bell} />
            <MetricCard title="Due Today" value={stats.dueTodayCount} icon={Clock} />
            <MetricCard title="Unread" value={stats.unreadCount} icon={Bell} />
            <MetricCard title="Completed" value={stats.completedCount} icon={Check} />
            {stats.snoozedCount != null ? (
              <MetricCard title="Snoozed" value={stats.snoozedCount} icon={Clock} />
            ) : null}
            <MetricCard title="Critical" value={stats.criticalCount} icon={Bell} />
          </div>
        ) : null}

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as "my" | "all"); setPage(1); }}>
            <TabsList>
              <TabsTrigger value="my">My Reminders</TabsTrigger>
              <TabsTrigger value="all">All Reminders</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {REMINDER_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search reminders..."
          exportFileName="reminders"
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <ReminderFormDialog open={formOpen} onOpenChange={setFormOpen} defaultUserId={user?._id} />
      <SnoozeDialog reminderId={snoozeId} onClose={() => setSnoozeId(null)} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reminder?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}

function ReminderFormDialog({
  open,
  onOpenChange,
  defaultUserId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  defaultUserId?: string;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Reminder["priority"],
    reminder_date: "",
    reminder_time: "",
    assigned_user_id: defaultUserId ?? "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      remindersApi.create({
        title: form.title,
        description: form.description || undefined,
        priority: form.priority,
        reminder_date: form.reminder_date,
        reminder_time: form.reminder_time || undefined,
        assigned_user_id: form.assigned_user_id,
      }),
    onSuccess: () => {
      toast.success("Reminder created");
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Create Reminder</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => v && setForm({ ...form, priority: v as Reminder["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REMINDER_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assigned User ID *</Label>
              <Input value={form.assigned_user_id} onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Reminder Date *</Label>
              <Input type="date" value={form.reminder_date} onChange={(e) => setForm({ ...form, reminder_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Input type="time" value={form.reminder_time} onChange={(e) => setForm({ ...form, reminder_time: e.target.value })} />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!form.title || !form.reminder_date || !form.assigned_user_id || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Create Reminder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SnoozeDialog({ reminderId, onClose }: { reminderId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [snoozedUntil, setSnoozedUntil] = useState("");

  const mutation = useMutation({
    mutationFn: () => remindersApi.snooze(reminderId!, snoozedUntil),
    onSuccess: () => {
      toast.success("Reminder snoozed");
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
      onClose();
      setSnoozedUntil("");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={!!reminderId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Snooze Reminder</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Snooze Until *</Label>
            <Input type="datetime-local" value={snoozedUntil} onChange={(e) => setSnoozedUntil(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!snoozedUntil || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Snoozing..." : "Snooze"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
