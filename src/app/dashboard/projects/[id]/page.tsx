"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { projectsApi } from "@/services/api/projects.api";
import { employeesApi } from "@/services/api/employees.api";
import { worklogsApi } from "@/services/api/worklogs.api";
import { paymentsApi } from "@/services/api/payments.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";
import {
  PROJECT_CATEGORIES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  PAYMENT_STATUSES,
} from "@/constants/enums";
import { ROUTES } from "@/constants/routes";
import { usePermissions } from "@/hooks/use-permissions";
import type { Project, ProjectStatus } from "@/types/project.types";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { canRead } = usePermissions();

  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | "">("");
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

  // Sync local state when project loads
  useEffect(() => {
    if (project) {
      setPendingStatus(project.status);
      setAssignedIds(project.assigned_employees ?? project.employees?.map((e) => e._id) ?? []);
    }
  }, [project?.status, project?._id]);

  const { data: worklogs } = useQuery({
    queryKey: ["worklogs", "project", id],
    queryFn: () => worklogsApi.getAll({ project_id: id, limit: 50 }),
    enabled: !!id && canRead("worklogs"),
  });

  const { data: payments } = useQuery({
    queryKey: ["payments", "project", id],
    queryFn: () => paymentsApi.getAll({ project_id: id, limit: 50 }),
    enabled: !!id && canRead("payments"),
  });

  const { data: employeesData, isLoading: empLoading } = useQuery({
    queryKey: ["employees", "dropdown"],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
  });

  const allEmployees = employeesData?.data ?? [];

  const statusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => projectsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const assignMutation = useMutation({
    mutationFn: () => projectsApi.assign(id, assignedIds),
    onSuccess: () => {
      toast.success("Assignment updated");
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.delete(id),
    onSuccess: () => {
      toast.success("Project deleted");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      router.push(ROUTES.projects);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!project) return <p>Project not found</p>;

  const statusChanged = pendingStatus && pendingStatus !== project.status;
  const isInProgress = pendingStatus === "in_progress";

  const toggleEmployee = (empId: string) =>
    setAssignedIds((prev) =>
      prev.includes(empId) ? prev.filter((e) => e !== empId) : [...prev, empId]
    );

  return (
    <ProtectedRoute module="projects">
      <div className="space-y-6">
        <PageHeader
          title={project.project_name}
          description={project.client?.company_name}
          actions={
            <div className="flex gap-2">
              <PermissionGate module="projects" action="update">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Edit
                </Button>
              </PermissionGate>
              <PermissionGate module="projects" action="delete">
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </PermissionGate>
            </div>
          }
        />

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            {canRead("worklogs") && <TabsTrigger value="worklogs">Worklogs</TabsTrigger>}
            {canRead("payments") && <TabsTrigger value="payments">Payments</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div><span className="text-muted-foreground">Client: </span>{project.client?.company_name ?? "—"}</div>
                  <div><span className="text-muted-foreground">Category: </span>{formatLabel(project.category)}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge>{formatLabel(project.status)}</Badge>
                  </div>
                  <div><span className="text-muted-foreground">Priority: </span>{formatLabel(project.priority)}</div>
                  <div><span className="text-muted-foreground">Payment: </span>{formatLabel(project.payment_status)}</div>
                  <div><span className="text-muted-foreground">Start: </span>{formatDate(project.start_date)}</div>
                  <div><span className="text-muted-foreground">Deadline: </span>{formatDate(project.end_date)}</div>
                  {project.notes && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Notes: </span>{project.notes}
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="space-y-4">
                {/* Update Status */}
                <PermissionGate module="projects" action="update">
                  <Card>
                    <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <Select
                        value={pendingStatus}
                        onValueChange={(v: string | null) => v && setPendingStatus(v as ProjectStatus)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PROJECT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isInProgress && (
                        <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          <strong>In Progress</strong> requires at least one assigned employee and an end date.
                        </p>
                      )}
                      <Button
                        className="w-full"
                        disabled={!statusChanged || statusMutation.isPending}
                        onClick={() => pendingStatus && statusMutation.mutate(pendingStatus as ProjectStatus)}
                      >
                        {statusMutation.isPending ? "Updating..." : "Update Status"}
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionGate>

                {/* Assign Employees */}
                <PermissionGate module="projects" action="update">
                  <Card>
                    <CardHeader><CardTitle>
                      Assign Employees
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({assignedIds.length} selected)
                      </span>
                    </CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <ScrollArea className="h-44 rounded-md border p-2">
                        {empLoading && (
                          <p className="px-1 py-2 text-sm text-muted-foreground">Loading employees...</p>
                        )}
                        {!empLoading && allEmployees.length === 0 && (
                          <p className="px-1 py-2 text-sm text-muted-foreground">No employees found</p>
                        )}
                        {allEmployees.map((emp) => (
                          <label key={emp._id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1.5 hover:bg-muted">
                            <Checkbox
                              checked={assignedIds.includes(emp._id)}
                              onCheckedChange={() => toggleEmployee(emp._id)}
                            />
                            <span className="text-sm">{emp.full_name}</span>
                            {emp.role_designation && (
                              <span className="ml-auto text-xs text-muted-foreground">{emp.role_designation}</span>
                            )}
                          </label>
                        ))}
                      </ScrollArea>
                      <Button
                        className="w-full"
                        disabled={assignedIds.length === 0 || assignMutation.isPending}
                        onClick={() => assignMutation.mutate()}
                      >
                        {assignMutation.isPending ? "Saving..." : "Update Assignment"}
                      </Button>
                    </CardContent>
                  </Card>
                </PermissionGate>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Assigned Team</CardTitle></CardHeader>
              <CardContent>
                {(project.employees ?? []).length ? (
                  <ul className="space-y-2">
                    {project.employees!.map((e) => (
                      <li key={e._id} className="rounded-lg border p-3 font-medium">{e.full_name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No employees assigned yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {canRead("worklogs") && (
            <TabsContent value="worklogs" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Employee</TableHead>
                        <TableHead>Task</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(worklogs?.data ?? []).map((w) => (
                        <TableRow key={w._id}>
                          <TableCell>{formatDate(w.date)}</TableCell>
                          <TableCell>{w.employee?.full_name ?? "—"}</TableCell>
                          <TableCell>{w.task_title}</TableCell>
                          <TableCell>{w.time_spent_hours}h</TableCell>
                          <TableCell>{formatLabel(w.work_status)}</TableCell>
                        </TableRow>
                      ))}
                      {!worklogs?.data?.length && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">No worklogs</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canRead("payments") && (
            <TabsContent value="payments" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(payments?.data ?? []).map((p) => (
                        <TableRow key={p._id}>
                          <TableCell>{formatDate(p.payment_date)}</TableCell>
                          <TableCell>{formatCurrency(p.amount)}</TableCell>
                          <TableCell>{formatLabel(p.payment_method)}</TableCell>
                        </TableRow>
                      ))}
                      {!payments?.data?.length && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">No payments</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Edit dialog — inline, reuses same form fields as list page */}
      <ProjectEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        project={project}
      />

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{project.project_name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
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

// ─── Inline Edit Dialog ───────────────────────────────────────────────────────

function ProjectEditDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project: Project;
}) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    project_name: "",
    category: "web_app" as Project["category"],
    priority: "medium" as Project["priority"],
    payment_status: "unpaid" as Project["payment_status"],
    start_date: "",
    end_date: "",
    notes: "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setForm({
        project_name: project.project_name,
        category: project.category,
        priority: project.priority,
        payment_status: project.payment_status,
        start_date: project.start_date ? project.start_date.slice(0, 10) : "",
        end_date: project.end_date ? project.end_date.slice(0, 10) : "",
        notes: project.notes ?? "",
      });
      setSelectedEmployees(project.assigned_employees ?? project.employees?.map((e) => e._id) ?? []);
    }
  }, [open, project._id]);

  const { data: employeesData } = useQuery({
    queryKey: ["employees", "dropdown"],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
    enabled: open,
  });

  const employees = employeesData?.data ?? [];

  const toggleEmployee = (id: string) =>
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );

  const mutation = useMutation({
    mutationFn: () =>
      projectsApi.update(project._id, {
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
      queryClient.invalidateQueries({ queryKey: ["projects", project._id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Project Name *</Label>
            <Input value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} />
          </div>
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
              <span className="ml-2 text-xs text-muted-foreground">({selectedEmployees.length} selected)</span>
            </Label>
            <ScrollArea className="h-40 rounded-md border p-2">
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
            disabled={!form.project_name || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
