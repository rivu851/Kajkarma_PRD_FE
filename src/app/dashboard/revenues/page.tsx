"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { revenuesApi } from "@/services/api/revenues.api";
import { clientsApi } from "@/services/api/clients.api";
import { projectsApi } from "@/services/api/projects.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { Revenue } from "@/types/revenue.types";
import { REVENUE_STATUSES, REVENUE_TYPES } from "@/constants/enums";
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
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";

export default function RevenuesPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    status: status !== "all" ? (status as Revenue["status"]) : undefined,
    type: type !== "all" ? (type as Revenue["type"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["revenues", params],
    queryFn: () => revenuesApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => revenuesApi.delete(id),
    onSuccess: () => {
      toast.success("Revenue deleted");
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Revenue>[]>(
    () => [
      { accessorKey: "title", header: "Title" },
      {
        id: "client",
        header: "Client",
        cell: ({ row }) => row.original.client?.company_name ?? "—",
      },
      {
        id: "project",
        header: "Project",
        cell: ({ row }) => row.original.project?.project_name ?? "—",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.type)}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "revenue_date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.revenue_date),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <PermissionGate module="revenue" action="delete">
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
    <ProtectedRoute module="revenue">
      <div className="space-y-6">
        <PageHeader
          title="Revenue"
          description="Track client revenue and billing."
          actions={
            <PermissionGate module="revenue" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Revenue
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {REVENUE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={type} onValueChange={(v) => { setType(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {REVENUE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} exportFileName="revenues" />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <RevenueFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete revenue?</AlertDialogTitle>
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

function RevenueFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    client_id: "",
    project_id: "",
    title: "",
    amount: "",
    revenue_date: "",
    due_date: "",
    type: "one_time" as Revenue["type"],
    notes: "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients", "dropdown"],
    queryFn: () => clientsApi.getAll({ limit: 100 }),
    enabled: open,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects", "dropdown", form.client_id],
    queryFn: () => projectsApi.getAll({ limit: 100, client_id: form.client_id || undefined }),
    enabled: open && !!form.client_id,
  });

  const mutation = useMutation({
    mutationFn: () =>
      revenuesApi.create({
        client_id: form.client_id,
        project_id: form.project_id || undefined,
        title: form.title,
        amount: Number(form.amount),
        revenue_date: form.revenue_date,
        due_date: form.due_date || undefined,
        type: form.type,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Revenue created");
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Create Revenue</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v ?? "", project_id: "" })}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {(clients?.data ?? []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Project</Label>
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
            <Label>Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as Revenue["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REVENUE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Revenue Date *</Label>
              <Input type="date" value={form.revenue_date} onChange={(e) => setForm({ ...form, revenue_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!form.client_id || !form.title || !form.amount || !form.revenue_date || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Create Revenue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
