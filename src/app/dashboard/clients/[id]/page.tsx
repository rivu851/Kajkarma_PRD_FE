"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientsApi } from "@/services/api/clients.api";
import { projectsApi } from "@/services/api/projects.api";
import { paymentsApi } from "@/services/api/payments.api";
import { communicationsApi } from "@/services/api/communications.api";
import { reportsApi } from "@/services/api/reports.api";
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
import { CLIENT_STATUSES } from "@/constants/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client } from "@/types/client.types";
import { usePermissions } from "@/hooks/use-permissions";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { canRead } = usePermissions();

  const { data: client, isLoading } = useQuery({
    queryKey: ["clients", id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", "client", id],
    queryFn: () => projectsApi.getAll({ client_id: id, limit: 50 }),
    enabled: !!id && canRead("projects"),
  });

  const { data: payments } = useQuery({
    queryKey: ["payments", "client", id],
    queryFn: () => paymentsApi.getAll({ client_id: id, limit: 50 }),
    enabled: !!id && canRead("payments"),
  });

  const { data: communications } = useQuery({
    queryKey: ["communications", "client", id],
    queryFn: () =>
      communicationsApi.getAll({ entity_type: "client", entity_id: id, limit: 50 }),
    enabled: !!id && canRead("communications"),
  });

  const { data: reports } = useQuery({
    queryKey: ["reports", "client", id],
    queryFn: () => reportsApi.getAll({ client_id: id, limit: 50 }),
    enabled: !!id && canRead("reports"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: Client["status"]) => clientsApi.update(id, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["clients", id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!client) return <p>Client not found</p>;

  return (
    <ProtectedRoute module="clients">
      <div className="space-y-6">
        <PageHeader title={client.company_name} description={client.contact_person_name} />

        <Tabs defaultValue="overview">
          <TabsList className="flex-wrap">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {canRead("projects") && <TabsTrigger value="projects">Projects</TabsTrigger>}
            {canRead("payments") && <TabsTrigger value="payments">Payments</TabsTrigger>}
            {canRead("communications") && <TabsTrigger value="communications">Communications</TabsTrigger>}
            {canRead("reports") && <TabsTrigger value="reports">Reports</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle>Company Information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div><span className="text-muted-foreground">Contact:</span> {client.contact_person_name}</div>
                  <div><span className="text-muted-foreground">Email:</span> {client.email ?? "—"}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {client.phone_number ?? "—"}</div>
                  <div><span className="text-muted-foreground">Sector:</span> {client.sector ?? "—"}</div>
                  <div><span className="text-muted-foreground">Website:</span> {client.website_link ? (
                    <a href={client.website_link} target="_blank" rel="noreferrer" className="text-primary hover:underline">{client.website_link}</a>
                  ) : "—"}</div>
                  <div><span className="text-muted-foreground">Address:</span> {client.address ?? "—"}</div>
                  <div><span className="text-muted-foreground">Account Manager:</span> {client.assigned_manager?.name ?? "—"}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge>{formatLabel(client.status)}</Badge>
                  </div>
                  {client.social_media_links && Object.keys(client.social_media_links).length > 0 && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Social:</span>{" "}
                      {Object.entries(client.social_media_links).map(([k, v]) => (
                        <a key={k} href={v} target="_blank" rel="noreferrer" className="mr-2 text-primary hover:underline">{k}</a>
                      ))}
                    </div>
                  )}
                  {client.notes ? (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Notes:</span> {client.notes}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
                <CardContent>
                  <PermissionGate module="clients" action="update">
                    <Select value={client.status} onValueChange={(v) => v && statusMutation.mutate(v as Client["status"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CLIENT_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PermissionGate>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {canRead("projects") && (
            <TabsContent value="projects" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>End Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(projects?.data ?? []).map((p) => (
                        <TableRow key={p._id}>
                          <TableCell className="font-medium">{p.project_name}</TableCell>
                          <TableCell>{formatLabel(p.status)}</TableCell>
                          <TableCell>{formatLabel(p.category)}</TableCell>
                          <TableCell>{formatDate(p.end_date)}</TableCell>
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

          {canRead("communications") && (
            <TabsContent value="communications" className="mt-6">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {(communications?.data ?? []).map((c) => (
                    <div key={c._id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{formatLabel(c.type)}</Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(c.date)}</span>
                      </div>
                      {c.notes && <p className="mt-2 text-sm">{c.notes}</p>}
                      {c.outcome && <p className="text-sm text-muted-foreground">Outcome: {c.outcome}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {canRead("reports") && (
            <TabsContent value="reports" className="mt-6">
              <Card>
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>File</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(reports?.data ?? []).map((r) => (
                        <TableRow key={r._id}>
                          <TableCell>{r.report_title}</TableCell>
                          <TableCell>{formatLabel(r.report_type)}</TableCell>
                          <TableCell>{formatDate(r.month)}</TableCell>
                          <TableCell>
                            <a href={r.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">Download</a>
                          </TableCell>
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
