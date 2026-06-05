"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { projectsApi } from "@/services/api/projects.api";
import { worklogsApi } from "@/services/api/worklogs.api";
import { paymentsApi } from "@/services/api/payments.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";
import { PROJECT_STATUSES } from "@/constants/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectStatus } from "@/types/project.types";
import { usePermissions } from "@/hooks/use-permissions";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { canRead } = usePermissions();

  const { data: project, isLoading } = useQuery({
    queryKey: ["projects", id],
    queryFn: () => projectsApi.getById(id),
    enabled: !!id,
  });

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

  const statusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => projectsApi.updateStatus(id, status),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["projects", id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!project) return <p>Project not found</p>;

  return (
    <ProtectedRoute module="projects">
      <div className="space-y-6">
        <PageHeader title={project.project_name} description={project.client?.company_name} />

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
                  <div><span className="text-muted-foreground">Client:</span> {project.client?.company_name ?? "—"}</div>
                  <div><span className="text-muted-foreground">Category:</span> {formatLabel(project.category)}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge>{formatLabel(project.status)}</Badge>
                  </div>
                  <div><span className="text-muted-foreground">Priority:</span> {formatLabel(project.priority)}</div>
                  <div><span className="text-muted-foreground">Payment:</span> {formatLabel(project.payment_status)}</div>
                  <div><span className="text-muted-foreground">Start:</span> {formatDate(project.start_date)}</div>
                  <div><span className="text-muted-foreground">Deadline:</span> {formatDate(project.end_date)}</div>
                  {project.notes ? (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Notes:</span> {project.notes}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
                <CardContent>
                  <PermissionGate module="projects" action="update">
                    <Select value={project.status} onValueChange={(v) => v && statusMutation.mutate(v as ProjectStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PROJECT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PermissionGate>
                </CardContent>
              </Card>
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
                  <p className="text-muted-foreground">No employees assigned</p>
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
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
