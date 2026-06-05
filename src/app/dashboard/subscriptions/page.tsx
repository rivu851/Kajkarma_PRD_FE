"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { subscriptionsApi, type Subscription } from "@/services/api/subscriptions.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { BILLING_CYCLES, SUBSCRIPTION_STATUSES } from "@/constants/enums";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DataTable } from "@/components/tables/data-table";
import { PaginationControls } from "@/components/tables/pagination-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [renewId, setRenewId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    status: status !== "all" ? (status as Subscription["status"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["subscriptions", params],
    queryFn: () => subscriptionsApi.getAll(params),
  });

  const { data: expiringSoon } = useQuery({
    queryKey: ["subscriptions", "expiring-soon"],
    queryFn: () => subscriptionsApi.getExpiringSoon(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => subscriptionsApi.delete(id),
    onSuccess: () => {
      toast.success("Subscription deleted");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Subscription>[]>(
    () => [
      { accessorKey: "plan_name", header: "Plan" },
      { accessorKey: "provider", header: "Provider" },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: "billing_cycle",
        header: "Billing",
        cell: ({ row }) => formatLabel(row.original.billing_cycle),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "renewal_date",
        header: "Renewal",
        cell: ({ row }) => formatDate(row.original.renewal_date),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <PermissionGate module="subscriptions" action="update">
              <Button size="sm" variant="outline" onClick={() => setRenewId(row.original._id)}>
                Renew
              </Button>
            </PermissionGate>
            <PermissionGate module="subscriptions" action="delete">
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
    <ProtectedRoute module="subscriptions">
      <div className="space-y-6">
        <PageHeader
          title="Subscriptions"
          description="Manage software and service subscriptions."
          actions={
            <PermissionGate module="subscriptions" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Button>
            </PermissionGate>
          }
        />

        {(expiringSoon?.length ?? 0) > 0 ? (
          <Card>
            <CardHeader><CardTitle className="text-sm">Expiring Soon</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {expiringSoon!.map((sub) => (
                <Badge key={sub._id} variant="outline">
                  {sub.plan_name} — {formatDate(sub.renewal_date)}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SUBSCRIPTION_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} exportFileName="subscriptions" />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <SubscriptionFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <RenewSubscriptionDialog subscriptionId={renewId} onClose={() => setRenewId(null)} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete subscription?</AlertDialogTitle>
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

function SubscriptionFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    plan_name: "",
    provider: "",
    start_date: "",
    end_date: "",
    renewal_date: "",
    amount: "",
    billing_cycle: "monthly" as Subscription["billing_cycle"],
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.create({
        plan_name: form.plan_name,
        provider: form.provider,
        start_date: form.start_date,
        end_date: form.end_date,
        renewal_date: form.renewal_date,
        amount: Number(form.amount),
        billing_cycle: form.billing_cycle,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Subscription created");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Create Subscription</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Plan Name *</Label>
              <Input value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Provider *</Label>
              <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Amount *</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Billing Cycle</Label>
              <Select value={form.billing_cycle} onValueChange={(v) => v && setForm({ ...form, billing_cycle: v as Subscription["billing_cycle"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BILLING_CYCLES.map((c) => (
                    <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Renewal Date *</Label>
              <Input type="date" value={form.renewal_date} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!form.plan_name || !form.provider || !form.start_date || !form.end_date || !form.renewal_date || !form.amount || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Create Subscription"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RenewSubscriptionDialog({ subscriptionId, onClose }: { subscriptionId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ end_date: "", renewal_date: "", amount: "" });

  const mutation = useMutation({
    mutationFn: () =>
      subscriptionsApi.renew(subscriptionId!, {
        end_date: form.end_date,
        renewal_date: form.renewal_date,
        amount: form.amount ? Number(form.amount) : undefined,
      }),
    onSuccess: () => {
      toast.success("Subscription renewed");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={!!subscriptionId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Renew Subscription</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>New End Date *</Label>
            <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>New Renewal Date *</Label>
            <Input type="date" value={form.renewal_date} onChange={(e) => setForm({ ...form, renewal_date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Amount (optional)</Label>
            <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          </div>
          <Button className="w-full" disabled={!form.end_date || !form.renewal_date || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Renewing..." : "Renew"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
