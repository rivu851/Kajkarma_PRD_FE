"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { reimbursementsApi, type Reimbursement } from "@/services/api/reimbursements.api";
import { employeesApi } from "@/services/api/employees.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { REIMBURSEMENT_CATEGORIES, REIMBURSEMENT_STATUSES } from "@/constants/enums";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

type ActionModal = { type: "approve" | "reject"; id: string } | null;
type PayModal = { id: string } | null;

export default function ReimbursementsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Reimbursement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<ActionModal>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [payModal, setPayModal] = useState<PayModal>(null);
  const [payDate, setPayDate] = useState("");
  const [payNotes, setPayNotes] = useState("");

  const params = {
    page,
    limit: 20,
    status: status !== "all" ? (status as Reimbursement["status"]) : undefined,
    category: category !== "all" ? (category as Reimbursement["category"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["reimbursements", params],
    queryFn: () => reimbursementsApi.getAll(params),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      reimbursementsApi.approve(id, notes),
    onSuccess: () => {
      toast.success("Reimbursement approved");
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      setActionModal(null);
      setActionNotes("");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      reimbursementsApi.reject(id, notes),
    onSuccess: () => {
      toast.success("Reimbursement rejected");
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      setActionModal(null);
      setActionNotes("");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, paid_date, notes }: { id: string; paid_date: string; notes?: string }) =>
      reimbursementsApi.pay(id, paid_date, notes),
    onSuccess: () => {
      toast.success("Reimbursement paid");
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      setPayModal(null);
      setPayDate("");
      setPayNotes("");
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reimbursementsApi.delete(id),
    onSuccess: () => {
      toast.success("Reimbursement deleted");
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Reimbursement>[]>(
    () => [
      { accessorKey: "expense_title", header: "Expense" },
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => row.original.employee?.full_name ?? "—",
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => formatCurrency(row.original.amount),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <Badge variant="outline">{formatLabel(row.original.category)}</Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "expense_date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.expense_date),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const s = row.original.status;
          return (
            <div className="flex flex-wrap gap-1">
              {(s === "submitted" || s === "under_review") && (
                <PermissionGate module="reimbursements" action="update">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActionModal({ type: "approve", id: row.original._id })}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActionModal({ type: "reject", id: row.original._id })}
                  >
                    Reject
                  </Button>
                </PermissionGate>
              )}
              {s === "approved" && (
                <PermissionGate module="reimbursements" action="update">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPayModal({ id: row.original._id })}
                  >
                    Pay
                  </Button>
                </PermissionGate>
              )}
              <PermissionGate module="reimbursements" action="update">
                <Button
                  size="sm"
                  variant="ghost"
                  title="Edit"
                  onClick={() => setEditItem(row.original)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </PermissionGate>
              <PermissionGate module="reimbursements" action="delete">
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original._id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </PermissionGate>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <ProtectedRoute module="reimbursements">
      <div className="space-y-6">
        <PageHeader
          title="Reimbursements"
          description="Submit and manage employee expense reimbursements."
          actions={
            <PermissionGate module="reimbursements" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Submit Reimbursement
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {REIMBURSEMENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={(v) => { setCategory(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {REIMBURSEMENT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          exportFileName="reimbursements"
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      {/* Create */}
      <ReimbursementFormDialog open={formOpen} onOpenChange={setFormOpen} />

      {/* Edit */}
      <EditReimbursementDialog item={editItem} onClose={() => setEditItem(null)} />

      {/* Approve / Reject */}
      <Dialog
        open={!!actionModal}
        onOpenChange={(o) => { if (!o) { setActionModal(null); setActionNotes(""); } }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {actionModal?.type === "approve" ? "Approve" : "Reject"} Reimbursement
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={
                  actionModal?.type === "reject" ? "Reason for rejection…" : "Optional notes…"
                }
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setActionModal(null); setActionNotes(""); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => {
                  if (!actionModal) return;
                  const payload = { id: actionModal.id, notes: actionNotes || undefined };
                  if (actionModal.type === "approve") approveMutation.mutate(payload);
                  else rejectMutation.mutate(payload);
                }}
              >
                {(approveMutation.isPending || rejectMutation.isPending)
                  ? "Submitting…"
                  : actionModal?.type === "approve"
                    ? "Approve"
                    : "Reject"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay */}
      <Dialog
        open={!!payModal}
        onOpenChange={(o) => { if (!o) { setPayModal(null); setPayDate(""); setPayNotes(""); } }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Mark as Paid</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Payment Date *</Label>
              <Input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => { setPayModal(null); setPayDate(""); setPayNotes(""); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!payDate || payMutation.isPending}
                onClick={() =>
                  payMutation.mutate({
                    id: payModal!.id,
                    paid_date: payDate,
                    notes: payNotes || undefined,
                  })
                }
              >
                {payMutation.isPending ? "Saving…" : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete reimbursement?</AlertDialogTitle>
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

// ─── Employee dropdown hook ───────────────────────────────────────────────────

function useEmployees() {
  return useQuery({
    queryKey: ["employees", { limit: 200 }],
    queryFn: () => employeesApi.getAll({ limit: 200 }),
  });
}

// ─── ReimbursementFormDialog ──────────────────────────────────────────────────

const EMPTY_FORM = {
  employee_id: "",
  expense_title: "",
  amount: "",
  expense_date: "",
  reason: "",
  category: "other" as Reimbursement["category"],
  bill_attachment_url: "",
  notes: "",
};

function ReimbursementFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const { data: employees } = useEmployees();

  const handleOpenChange = (o: boolean) => {
    if (!o) setForm(EMPTY_FORM);
    onOpenChange(o);
  };

  const mutation = useMutation({
    mutationFn: () =>
      reimbursementsApi.create({
        employee_id: form.employee_id,
        expense_title: form.expense_title,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        reason: form.reason,
        category: form.category,
        bill_attachment_url: form.bill_attachment_url || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Reimbursement submitted");
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      handleOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const disabled =
    !form.employee_id ||
    !form.expense_title ||
    !form.amount ||
    !form.expense_date ||
    !form.reason ||
    mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Submit Reimbursement</DialogTitle></DialogHeader>
        <ReimbursementFields
          form={form}
          setForm={setForm}
          employees={employees?.data ?? []}
        />
        <Button className="w-full" disabled={disabled} onClick={() => mutation.mutate()}>
          {mutation.isPending ? "Submitting…" : "Submit"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

// ─── EditReimbursementDialog ──────────────────────────────────────────────────

function EditReimbursementDialog({
  item,
  onClose,
}: {
  item: Reimbursement | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (item) {
      setForm({
        employee_id: item.employee_id,
        expense_title: item.expense_title,
        amount: String(item.amount),
        expense_date: item.expense_date?.split("T")[0] ?? "",
        reason: item.reason,
        category: item.category,
        bill_attachment_url: item.bill_attachment_url ?? "",
        notes: item.notes ?? "",
      });
    }
  }, [item]);

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: () =>
      reimbursementsApi.update(item!._id, {
        expense_title: form.expense_title,
        amount: Number(form.amount),
        expense_date: form.expense_date,
        reason: form.reason,
        category: form.category,
        bill_attachment_url: form.bill_attachment_url || undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Reimbursement updated");
      queryClient.invalidateQueries({ queryKey: ["reimbursements"] });
      handleClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Edit Reimbursement</DialogTitle></DialogHeader>
        {/* Employee is read-only in edit — API doesn't allow changing it */}
        <div className="space-y-2">
          <Label>Employee</Label>
          <Input value={item?.employee?.full_name ?? item?.employee_id ?? ""} disabled />
        </div>
        <ReimbursementFields
          form={form}
          setForm={setForm}
          employees={[]}
          hideEmployee
        />
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
          <Button
            className="flex-1"
            disabled={!form.expense_title || !form.amount || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Shared form fields ───────────────────────────────────────────────────────

type ReimbursementForm = typeof EMPTY_FORM;
type Employee = { _id: string; full_name: string };

function ReimbursementFields({
  form,
  setForm,
  employees,
  hideEmployee = false,
}: {
  form: ReimbursementForm;
  setForm: (f: ReimbursementForm) => void;
  employees: Employee[];
  hideEmployee?: boolean;
}) {
  const set =
    (k: keyof ReimbursementForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value });

  return (
    <div className="space-y-4">
      {!hideEmployee && (
        <div className="space-y-2">
          <Label>Employee *</Label>
          <Select
            value={form.employee_id || "none"}
            onValueChange={(v) => setForm({ ...form, employee_id: v === "none" ? "" : (v ?? "") })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Select employee —</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp._id} value={emp._id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Expense Title *</Label>
        <Input value={form.expense_title} onChange={set("expense_title")} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Amount *</Label>
          <Input type="number" min={0} value={form.amount} onChange={set("amount")} />
        </div>
        <div className="space-y-2">
          <Label>Expense Date *</Label>
          <Input type="date" value={form.expense_date} onChange={set("expense_date")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={form.category}
          onValueChange={(v) => v && setForm({ ...form, category: v as Reimbursement["category"] })}
        >
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {REIMBURSEMENT_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{formatLabel(c)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Reason *</Label>
        <Textarea value={form.reason} onChange={set("reason")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label>Bill / Attachment URL</Label>
        <Input
          type="url"
          value={form.bill_attachment_url}
          onChange={set("bill_attachment_url")}
          placeholder="https://…"
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={form.notes} onChange={set("notes")} rows={2} />
      </div>
    </div>
  );
}
