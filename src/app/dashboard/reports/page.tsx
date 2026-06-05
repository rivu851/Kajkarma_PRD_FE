"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { reportsApi, type Report } from "@/services/api/reports.api";
import { clientsApi } from "@/services/api/clients.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { REPORT_TYPES } from "@/constants/enums";
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
import { formatDate, formatLabel } from "@/utils/format";

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [reportType, setReportType] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    report_type: reportType !== "all" ? (reportType as Report["report_type"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reports", params],
    queryFn: () => reportsApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => {
      toast.success("Report deleted");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      { accessorKey: "report_title", header: "Title" },
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
        accessorKey: "report_type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.report_type)}</Badge>,
      },
      { accessorKey: "month", header: "Month" },
      {
        accessorKey: "createdAt",
        header: "Uploaded",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "file",
        header: "File",
        cell: ({ row }) =>
          row.original.file_url ? (
            <a href={row.original.file_url} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline">
              View
            </a>
          ) : (
            "—"
          ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <PermissionGate module="reports" action="delete">
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
    <ProtectedRoute module="reports">
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          description="Manage client reports and deliverables."
          actions={
            <PermissionGate module="reports" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Report
              </Button>
            </PermissionGate>
          }
        />

        <Select value={reportType} onValueChange={(v) => { setReportType(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {REPORT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} exportFileName="reports" />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <ReportFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
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

function ReportFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    client_id: "",
    report_title: "",
    report_type: "other" as Report["report_type"],
    month: "",
    file_url: "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients", "dropdown"],
    queryFn: () => clientsApi.getAll({ limit: 100 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      reportsApi.create({
        client_id: form.client_id,
        report_title: form.report_title,
        report_type: form.report_type,
        month: form.month,
        file_url: form.file_url,
      }),
    onSuccess: () => {
      toast.success("Report created");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Add Report</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Client *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent>
                {(clients?.data ?? []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.company_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Report Title *</Label>
            <Input value={form.report_title} onChange={(e) => setForm({ ...form, report_title: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.report_type} onValueChange={(v) => v && setForm({ ...form, report_type: v as Report["report_type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Month *</Label>
              <Input type="month" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>File URL *</Label>
            <Input value={form.file_url} onChange={(e) => setForm({ ...form, file_url: e.target.value })} placeholder="https://..." />
          </div>
          <Button
            className="w-full"
            disabled={!form.client_id || !form.report_title || !form.month || !form.file_url || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Add Report"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
