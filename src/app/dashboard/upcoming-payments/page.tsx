"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { upcomingPaymentsApi } from "@/services/api/upcomingPayments.api";
import { clientsApi } from "@/services/api/clients.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { UpcomingPayment } from "@/types/payment.types";
import { UPCOMING_PAYMENT_STATUSES, UPCOMING_PAYMENT_TYPES } from "@/constants/enums";
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

export default function UpcomingPaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [paymentType, setPaymentType] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    payment_status: paymentStatus !== "all" ? (paymentStatus as UpcomingPayment["payment_status"]) : undefined,
    payment_type: paymentType !== "all" ? (paymentType as UpcomingPayment["payment_type"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["upcoming-payments", params],
    queryFn: () => upcomingPaymentsApi.getAll(params),
  });

  const receiveMutation = useMutation({
    mutationFn: (id: string) => upcomingPaymentsApi.receive(id),
    onSuccess: () => {
      toast.success("Payment marked as received");
      queryClient.invalidateQueries({ queryKey: ["upcoming-payments"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => upcomingPaymentsApi.cancel(id),
    onSuccess: () => {
      toast.success("Payment cancelled");
      queryClient.invalidateQueries({ queryKey: ["upcoming-payments"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => upcomingPaymentsApi.delete(id),
    onSuccess: () => {
      toast.success("Upcoming payment deleted");
      queryClient.invalidateQueries({ queryKey: ["upcoming-payments"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<UpcomingPayment>[]>(
    () => [
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
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => formatDate(row.original.due_date),
      },
      {
        accessorKey: "payment_type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.payment_type)}</Badge>,
      },
      {
        accessorKey: "payment_status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.payment_status)}</Badge>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-1">
            {row.original.payment_status === "pending" ? (
              <PermissionGate module="payments" action="update">
                <Button size="sm" variant="outline" onClick={() => receiveMutation.mutate(row.original._id)} disabled={receiveMutation.isPending}>
                  Receive
                </Button>
                <Button size="sm" variant="outline" onClick={() => cancelMutation.mutate(row.original._id)} disabled={cancelMutation.isPending}>
                  Cancel
                </Button>
              </PermissionGate>
            ) : null}
            <PermissionGate module="payments" action="delete">
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original._id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    [receiveMutation, cancelMutation]
  );

  return (
    <ProtectedRoute module="payments">
      <div className="space-y-6">
        <PageHeader
          title="Upcoming Payments"
          description="Track expected and confirmed upcoming payments."
          actions={
            <PermissionGate module="payments" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Upcoming Payment
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex flex-wrap gap-2">
          <Select value={paymentStatus} onValueChange={(v) => { setPaymentStatus(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {UPCOMING_PAYMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentType} onValueChange={(v) => { setPaymentType(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {UPCOMING_PAYMENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} exportFileName="upcoming-payments" />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <UpcomingPaymentFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete upcoming payment?</AlertDialogTitle>
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

function UpcomingPaymentFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    client_id: "",
    amount: "",
    due_date: "",
    payment_type: "expected" as UpcomingPayment["payment_type"],
    notes: "",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients", "dropdown"],
    queryFn: () => clientsApi.getAll({ limit: 100 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      upcomingPaymentsApi.create({
        client_id: form.client_id,
        amount: Number(form.amount),
        due_date: form.due_date,
        payment_type: form.payment_type,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Upcoming payment created");
      queryClient.invalidateQueries({ queryKey: ["upcoming-payments"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Add Upcoming Payment</DialogTitle></DialogHeader>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Due Date *</Label>
              <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={form.payment_type} onValueChange={(v) => v && setForm({ ...form, payment_type: v as UpcomingPayment["payment_type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {UPCOMING_PAYMENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!form.client_id || !form.amount || !form.due_date || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
