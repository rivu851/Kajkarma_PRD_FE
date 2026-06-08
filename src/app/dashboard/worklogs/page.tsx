"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2, Pencil, ChevronDown, ChevronRight, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import {
  worklogsApi,
  type Worklog,
  type CreateWorklogPayload,
  type GroupedWorklogProject,
} from "@/services/api/worklogs.api";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatLabel } from "@/utils/format";

type ViewMode = "table" | "grouped";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  completed: "default",
  in_progress: "secondary",
  blocked: "destructive",
};

// ─── ProjectGroup ─────────────────────────────────────────────────────────────

function ProjectGroupCard({
  group,
  onEdit,
  onDelete,
}: {
  group: GroupedWorklogProject;
  onEdit: (w: Worklog) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none py-4"
        onClick={() => setOpen((p) => !p)}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-muted-foreground">
              {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
            <span className="font-semibold truncate">{group.project_name}</span>
            <Badge variant="outline" className="shrink-0">{formatLabel(group.project_status)}</Badge>
          </div>
          <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {group.total_hours} hrs
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              {group.entries_count} {group.entries_count === 1 ? "entry" : "entries"}
            </span>
          </div>
        </div>
      </CardHeader>

      {open && (
        <CardContent className="pt-0">
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Task</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Hours</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {group.logs.map((log) => (
                  <tr key={log._id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{log.task_title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{log.employee?.full_name ?? "—"}</td>
                    <td className="px-3 py-2 text-muted-foreground">{formatDate(log.date)}</td>
                    <td className="px-3 py-2">{log.time_spent_hours}</td>
                    <td className="px-3 py-2">
                      <Badge variant={STATUS_VARIANT[log.work_status] ?? "outline"}>
                        {formatLabel(log.work_status)}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1 justify-end">
                        <PermissionGate module="worklogs" action="update">
                          <Button size="sm" variant="ghost" onClick={() => onEdit(log)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate module="worklogs" action="delete">
                          <Button size="sm" variant="ghost" onClick={() => onDelete(log._id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function GroupedViewSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader className="py-4">
            <Skeleton className="h-5 w-64" />
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

// ─── WorklogsPage ─────────────────────────────────────────────────────────────

export default function WorklogsPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<ViewMode>("grouped");
  const [page, setPage] = useState(1);
  const [workStatus, setWorkStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingWorklog, setEditingWorklog] = useState<Worklog | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filterParams = {
    work_status: workStatus !== "all" ? (workStatus as Worklog["work_status"]) : undefined,
  };

  const tableParams = { ...filterParams, page, limit: 20 };

  const { data, isLoading } = useQuery({
    queryKey: ["worklogs", tableParams],
    queryFn: () => worklogsApi.getAll(tableParams),
    enabled: view === "table",
  });

  const { data: groupedData, isLoading: groupedLoading } = useQuery({
    queryKey: ["worklogs", "grouped", filterParams],
    queryFn: () => worklogsApi.getGrouped(filterParams),
    enabled: view === "grouped",
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
        cell: ({ row }) => (
          <Badge variant={STATUS_VARIANT[row.original.work_status] ?? "outline"}>
            {formatLabel(row.original.work_status)}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <PermissionGate module="worklogs" action="update">
              <Button size="sm" variant="ghost" onClick={() => setEditingWorklog(row.original)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            <PermissionGate module="worklogs" action="delete">
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original._id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </PermissionGate>
          </div>
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

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="table">Table</TabsTrigger>
              <TabsTrigger value="grouped">By Project</TabsTrigger>
            </TabsList>
          </Tabs>

          <Select
            value={workStatus}
            onValueChange={(v) => { setWorkStatus(v ?? "all"); setPage(1); }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {WORK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {view === "table" && (
          <>
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              isLoading={isLoading}
              exportFileName="worklogs"
            />
            <PaginationControls
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              total={data?.total}
              onPageChange={setPage}
            />
          </>
        )}

        {view === "grouped" && (
          <div className="space-y-3">
            {groupedLoading ? (
              <GroupedViewSkeleton />
            ) : !groupedData?.data.length ? (
              <div className="py-16 text-center text-muted-foreground">No worklogs found.</div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {groupedData.total_projects} project{groupedData.total_projects !== 1 ? "s" : ""}
                </p>
                {groupedData.data.map((group) => (
                  <ProjectGroupCard
                    key={group.project_id}
                    group={group}
                    onEdit={setEditingWorklog}
                    onDelete={setDeleteId}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <WorklogFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <WorklogFormDialog
        open={!!editingWorklog}
        onOpenChange={(o) => !o && setEditingWorklog(undefined)}
        worklog={editingWorklog}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete worklog?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}

// ─── WorklogFormDialog ────────────────────────────────────────────────────────

interface WorklogFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  worklog?: Worklog;
}

function WorklogFormDialog({ open, onOpenChange, worklog }: WorklogFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = !!worklog;

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

  useEffect(() => {
    if (open && worklog) {
      setForm({
        project_id: worklog.project_id ?? "",
        date: worklog.date ? worklog.date.slice(0, 10) : "",
        task_title: worklog.task_title ?? "",
        task_description: worklog.task_description ?? "",
        time_spent_hours: worklog.time_spent_hours != null ? String(worklog.time_spent_hours) : "",
        work_status: worklog.work_status ?? "in_progress",
        remarks: worklog.remarks ?? "",
      });
    } else if (!open) {
      setForm({
        project_id: "",
        date: "",
        task_title: "",
        task_description: "",
        time_spent_hours: "",
        work_status: "in_progress",
        remarks: "",
      });
    }
  }, [open, worklog]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Partial<CreateWorklogPayload> = {
        project_id: form.project_id,
        date: form.date,
        task_title: form.task_title,
        task_description: form.task_description || undefined,
        time_spent_hours: Number(form.time_spent_hours),
        work_status: form.work_status,
        remarks: form.remarks || undefined,
      };
      if (isEdit) return worklogsApi.update(worklog._id, payload);
      return worklogsApi.create(payload as CreateWorklogPayload);
    },
    onSuccess: () => {
      toast.success(isEdit ? "Worklog updated" : "Worklog created");
      queryClient.invalidateQueries({ queryKey: ["worklogs"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const canSubmit = !!form.project_id && !!form.date && !!form.task_title && !!form.time_spent_hours;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Worklog" : "Create Worklog"}</DialogTitle>
        </DialogHeader>
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
            <Input
              type="number"
              step="0.5"
              value={form.time_spent_hours}
              onChange={(e) => setForm({ ...form, time_spent_hours: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={form.work_status}
              onValueChange={(v) => v && setForm({ ...form, work_status: v as Worklog["work_status"] })}
            >
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
            <Textarea
              value={form.task_description}
              onChange={(e) => setForm({ ...form, task_description: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Remarks</Label>
            <Input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? (isEdit ? "Saving..." : "Creating...")
              : (isEdit ? "Save Changes" : "Create Worklog")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
