"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { paymentsApi } from "@/services/api/payments.api";
import { revenuesApi } from "@/services/api/revenues.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { Payment } from "@/types/payment.types";
import { PAYMENT_METHODS } from "@/constants/enums";
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

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    payment_method: paymentMethod !== "all" ? (paymentMethod as Payment["payment_method"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["payments", params],
    queryFn: () => paymentsApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.delete(id),
    onSuccess: () => {
      toast.success("Payment deleted");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Payment>[]>(
    () => [
      {
        id: "revenue",
        header: "Revenue",
        cell: ({ row }) => row.original.revenue?.title ?? "—",
      },
      {
        id: "client",
        header: "Client",
        cell: ({ row }) => row.original.client?.company_name ?? "—",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: "payment_method",
        header: "Method",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.payment_method)}</Badge>,
      },
      {
        accessorKey: "payment_date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.payment_date),
      },
      { accessorKey: "reference_number", header: "Reference" },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <PermissionGate module="payments" action="delete">
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
    <ProtectedRoute module="payments">
      <div className="space-y-6">
        <PageHeader
          title="Payments"
          description="Record and track client payments."
          actions={
            <PermissionGate module="payments" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record Payment
              </Button>
            </PermissionGate>
          }
        />

        <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Method" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All methods</SelectItem>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>{formatLabel(m)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} exportFileName="payments" />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <PaymentFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete payment?</AlertDialogTitle>
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

function PaymentFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    revenue_id: "",
    amount: "",
    payment_date: "",
    payment_method: "bank_transfer" as Payment["payment_method"],
    reference_number: "",
    notes: "",
  });

  const { data: revenues } = useQuery({
    queryKey: ["revenues", "dropdown"],
    queryFn: () => revenuesApi.getAll({ limit: 100 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      paymentsApi.create({
        revenue_id: form.revenue_id,
        amount: Number(form.amount),
        payment_date: form.payment_date,
        payment_method: form.payment_method,
        reference_number: form.reference_number || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Payment recorded");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Revenue *</Label>
            <Select value={form.revenue_id} onValueChange={(v) => setForm({ ...form, revenue_id: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select revenue" /></SelectTrigger>
              <SelectContent>
                {(revenues?.data ?? []).map((r) => (
                  <SelectItem key={r._id} value={r._id}>{r.title} — {formatCurrency(r.amount)}</SelectItem>
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
              <Label>Payment Date *</Label>
              <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Method</Label>
            <Select value={form.payment_method} onValueChange={(v) => v && setForm({ ...form, payment_method: v as Payment["payment_method"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>{formatLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Reference Number</Label>
            <Input value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!form.revenue_id || !form.amount || !form.payment_date || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving..." : "Record Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
