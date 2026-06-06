"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Trash2, Pencil, Users, Layers } from "lucide-react";
import { toast } from "sonner";
import { projectsApi } from "@/services/api/projects.api";
import { clientsApi } from "@/services/api/clients.api";
import { employeesApi } from "@/services/api/employees.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { Project } from "@/types/project.types";
import {
  PROJECT_CATEGORIES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PAYMENT_STATUSES,
} from "@/constants/enums";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DataTable } from "@/components/tables/data-table";
import { PaginationControls } from "@/components/tables/pagination-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDate, formatLabel } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const [assigningProject, setAssigningProject] = useState<Project | undefined>();
  const [statusProject, setStatusProject] = useState<Project | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    search: search || undefined,
    status: status !== "all" ? (status as Project["status"]) : undefined,
    category: category !== "all" ? (category as Project["category"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["projects", params],
    queryFn: () => projectsApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Project>[]>(
    () => [
      {
        accessorKey: "project_name",
        header: "Project",
        cell: ({ row }) => (
          <Link href={`${ROUTES.projects}/${row.original._id}`} className="font-medium hover:underline">
            {row.original.project_name}
          </Link>
        ),
      },
      {
        id: "client",
        header: "Client",
        cell: ({ row }) => row.original.client?.company_name ?? "—",
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.category)}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => formatLabel(row.original.priority),
      },
      {
        accessorKey: "payment_status",
        header: "Payment",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.payment_status)}</Badge>,
      },
      {
        accessorKey: "end_date",
        header: "End Date",
        cell: ({ row }) => formatDate(row.original.end_date),
      },
      {
        id: "team",
        header: "Team",
        cell: ({ row }) => {
          const count = row.original.employees?.length ?? row.original.assigned_employees?.length ?? 0;
          return count ? `${count} member${count > 1 ? "s" : ""}` : "—";
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <PermissionGate module="projects" action="update">
              <Button
                size="sm"
                variant="ghost"
                title="Edit project"
                onClick={() => { setEditingProject(row.original); setFormOpen(true); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Change status"
                onClick={() => setStatusProject(row.original)}
              >
                <Layers className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                title="Assign employees"
                onClick={() => setAssigningProject(row.original)}
              >
                <Users className="h-3.5 w-3.5" />
              </Button>
            </PermissionGate>
            <PermissionGate module="projects" action="delete">
              <Button
                size="sm"
                variant="ghost"
                title="Delete project"
                onClick={() => setDeleteId(row.original._id)}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <ProtectedRoute module="projects">
      <div className="space-y-6">
        <PageHeader
          title="Project Management"
          description="Track projects, status, and assignments."
          actions={
            <PermissionGate module="projects" action="create">
              <Button onClick={() => { setEditingProject(undefined); setFormOpen(true); }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Project
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v: string | null) => { setStatus(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {PROJECT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v: string | null) => { setCategory(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {PROJECT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>
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
          searchPlaceholder="Search projects..."
          exportFileName="projects"
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <ProjectFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditingProject(undefined); }}
        project={editingProject}
      />

      <AssignEmployeesDialog
        project={assigningProject}
        open={!!assigningProject}
        onOpenChange={(o: boolean) => { if (!o) setAssigningProject(undefined); }}
      />

      <ChangeStatusDialog
        project={statusProject}
        open={!!statusProject}
        onOpenChange={(o: boolean) => { if (!o) setStatusProject(undefined); }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}

// ─── Create / Edit ────────────────────────────────────────────────────────────

function ProjectFormDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project?: Project;
}) {
  const isEdit = !!project;
  const queryClient = useQueryClient();

  const emptyForm = {
    project_name: "",
    client_id: "",
    category: "web_app" as Project["category"],
    priority: "medium" as Project["priority"],
    payment_status: "unpaid" as Project["payment_status"],
    start_date: "",
    end_date: "",
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    if (open && project) {
      setForm({
        project_name: project.project_name,
        client_id: project.client_id,
        category: project.category,
        priority: project.priority,
        payment_status: project.payment_status,
        start_date: project.start_date ? project.start_date.slice(0, 10) : "",
        end_date: project.end_date ? project.end_date.slice(0, 10) : "",
        notes: project.notes ?? "",
      });
      setSelectedEmployees(project.assigned_employees ?? project.employees?.map((e) => e._id) ?? []);
    } else if (open && !project) {
      setForm(emptyForm);
      setSelectedEmployees([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, project?._id]);

  const { data: clients } = useQuery({
    queryKey: ["clients", "dropdown"],
    queryFn: () => clientsApi.getAll({ limit: 100 }),
    enabled: open,
  });

  const { data: employeesData, isLoading: empLoading } = useQuery({
    queryKey: ["employees", "dropdown"],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
    enabled: open,
  });

  const employees = employeesData?.data ?? [];

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const reset = () => { setForm(emptyForm); setSelectedEmployees([]); };

  const createMutation = useMutation({
    mutationFn: () =>
      projectsApi.create({
        project_name: form.project_name,
        client_id: form.client_id,
        category: form.category,
        priority: form.priority,
        payment_status: form.payment_status,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
        notes: form.notes || undefined,
        assigned_employees: selectedEmployees.length ? selectedEmployees : undefined,
      }),
    onSuccess: () => {
      toast.success("Project created");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      projectsApi.update(project!._id, {
        project_name: form.project_name,
        category: form.category,
        priority: form.priority,
        payment_status: form.payment_status,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        notes: form.notes || undefined,
        assigned_employees: selectedEmployees,
      }),
    onSuccess: () => {
      toast.success("Project updated");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", project!._id] });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;
  const canSubmit = !!form.project_name && (isEdit || !!form.client_id);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "Create Project"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
          </div>

          {!isEdit && (
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={(v: string | null) => setForm({ ...form, client_id: v ?? "" })}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {(clients?.data ?? []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.company_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v: string | null) => v && setForm({ ...form, category: v as Project["category"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v: string | null) => v && setForm({ ...form, priority: v as Project["priority"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment Status</Label>
            <Select value={form.payment_status} onValueChange={(v: string | null) => v && setForm({ ...form, payment_status: v as Project["payment_status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_STATUSES.map((p) => (
                  <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              Assign Employees
              {selectedEmployees.length > 0 && (
                <span className="ml-2 text-xs text-muted-foreground">({selectedEmployees.length} selected)</span>
              )}
            </Label>
            <ScrollArea className="h-40 rounded-md border p-2">
              {empLoading && (
                <p className="px-1 py-2 text-sm text-muted-foreground">Loading employees...</p>
              )}
              {!empLoading && employees.length === 0 && (
                <p className="px-1 py-2 text-sm text-muted-foreground">No employees found</p>
              )}
              {employees.map((emp) => (
                <label key={emp._id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted">
                  <Checkbox
                    checked={selectedEmployees.includes(emp._id)}
                    onCheckedChange={() => toggleEmployee(emp._id)}
                  />
                  <span className="text-sm">{emp.full_name}</span>
                  {emp.role_designation && (
                    <span className="ml-auto text-xs text-muted-foreground">{emp.role_designation}</span>
                  )}
                </label>
              ))}
            </ScrollArea>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <Button
            className="w-full"
            disabled={!canSubmit || isPending}
            onClick={() => isEdit ? updateMutation.mutate() : createMutation.mutate()}
          >
            {isPending
              ? isEdit ? "Saving..." : "Creating..."
              : isEdit ? "Save Changes" : "Create Project"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assign Employees ─────────────────────────────────────────────────────────

function AssignEmployeesDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open && project) {
      setSelected(project.assigned_employees ?? project.employees?.map((e) => e._id) ?? []);
    }
  }, [open, project?._id]);

  const { data: employeesData, isLoading: empLoading } = useQuery({
    queryKey: ["employees", "dropdown"],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
    enabled: open,
  });

  const employees = employeesData?.data ?? [];

  const toggle = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);

  const mutation = useMutation({
    mutationFn: () => projectsApi.assign(project!._id, selected),
    onSuccess: () => {
      toast.success("Employees assigned");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", project!._id] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Employees</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Select employees for <span className="font-medium text-foreground">{project?.project_name}</span>.
            This replaces the current assignment.
          </p>
          <ScrollArea className="h-52 rounded-md border p-2">
            {empLoading && (
              <p className="px-1 py-2 text-sm text-muted-foreground">Loading employees...</p>
            )}
            {!empLoading && employees.length === 0 && (
              <p className="px-1 py-2 text-sm text-muted-foreground">No employees found</p>
            )}
            {employees.map((emp) => (
              <label key={emp._id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted">
                <Checkbox
                  checked={selected.includes(emp._id)}
                  onCheckedChange={() => toggle(emp._id)}
                />
                <span className="text-sm">{emp.full_name}</span>
                {emp.role_designation && (
                  <span className="ml-auto text-xs text-muted-foreground">{emp.role_designation}</span>
                )}
              </label>
            ))}
          </ScrollArea>
          <p className="text-xs text-muted-foreground">{selected.length} employee{selected.length !== 1 ? "s" : ""} selected</p>
          <Button
            className="w-full"
            disabled={selected.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving..." : "Update Assignment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Status ────────────────────────────────────────────────────────────

function ChangeStatusDialog({
  project,
  open,
  onOpenChange,
}: {
  project: Project | undefined;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState("");

  const handleClose = (o: boolean) => {
    if (!o) setNewStatus("");
    onOpenChange(o);
  };

  const mutation = useMutation({
    mutationFn: () => projectsApi.updateStatus(project!._id, newStatus as Project["status"]),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["projects", project!._id] });
      setNewStatus("");
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const isInProgress = newStatus === "in_progress";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {project && (
            <p className="text-sm text-muted-foreground">
              Current: <span className="font-medium text-foreground">{formatLabel(project.status)}</span>
            </p>
          )}
          <Select value={newStatus} onValueChange={(v: string | null) => setNewStatus(v ?? "")}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_STATUSES.filter((s) => s !== project?.status).map((s) => (
                <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isInProgress && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              Setting to <strong>In Progress</strong> requires at least one assigned employee and an end date.
            </p>
          )}
          <Button
            className="w-full"
            disabled={!newStatus || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
