"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { worklogsApi, type Worklog } from "@/services/api/worklogs.api";
import { projectsApi } from "@/services/api/projects.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { WORK_STATUSES } from "@/constants/enums";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DataTable } from "@/components/tables/data-table";
import { PaginationControls } from "@/components/tables/pagination-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function WorklogsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [workStatus, setWorkStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    work_status: workStatus !== "all" ? (workStatus as Worklog["work_status"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["worklogs", params],
    queryFn: () => worklogsApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => worklogsApi.delete(id),
    onSuccess: () => {
      toast.success("Worklog deleted");
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Worklog>[]>(
    () => [
      { accessorKey: "task_title", header: "Task" },
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => row.original.employee?.full_name ?? "—",
      },
      {
        id: "project",
        header: "Project",
        cell: ({ row }) => row.original.project?.project_name ?? "—",
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: "time_spent_hours",
        header: "Hours",
      },
      {
        accessorKey: "work_status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.work_status)}</Badge>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <PermissionGate module="worklogs" action="delete">
            <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original._id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </PermissionGate>
        ),
      },
    ],
    []
  );

  return (
    <ProtectedRoute module="worklogs">
      <div className="space-y-6">
        <PageHeader
          title="Worklogs"
          description="Track employee work hours and task progress."
          actions={
            <PermissionGate module="worklogs" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Worklog
              </Button>
            </PermissionGate>
          }
        />

        <Select value={workStatus} onValueChange={(v) => { setWorkStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {WORK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} exportFileName="worklogs" />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <WorklogFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete worklog?</AlertDialogTitle>
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

function WorklogFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    project_id: "",
    date: "",
    task_title: "",
    task_description: "",
    time_spent_hours: "",
    work_status: "in_progress" as Worklog["work_status"],
    remarks: "",
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", "dropdown"],
    queryFn: () => projectsApi.getAll({ limit: 100 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      worklogsApi.create({
        project_id: form.project_id,
        date: form.date,
        task_title: form.task_title,
        task_description: form.task_description || undefined,
        time_spent_hours: Number(form.time_spent_hours),
        work_status: form.work_status,
        remarks: form.remarks || undefined,
      }),
    onSuccess: () => {
      toast.success("Worklog created");
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Create Worklog</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project *</Label>
            <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
              <SelectContent>
                {(projects?.data ?? []).map((p) => (
                  <SelectItem key={p._id} value={p._id}>{p.project_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date *</Label>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Task Title *</Label>
            <Input value={form.task_title} onChange={(e) => setForm({ ...form, task_title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Hours *</Label>
            <Input type="number" step="0.5" value={form.time_spent_hours} onChange={(e) => setForm({ ...form, time_spent_hours: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.work_status} onValueChange={(v) => v && setForm({ ...form, work_status: v as Worklog["work_status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {WORK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.task_description} onChange={(e) => setForm({ ...form, task_description: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!form.project_id || !form.date || !form.task_title || !form.time_spent_hours || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Create Worklog"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
