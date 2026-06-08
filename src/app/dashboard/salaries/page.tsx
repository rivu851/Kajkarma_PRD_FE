"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { salariesApi } from "@/services/api/salaries.api";
import { employeesApi } from "@/services/api/employees.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { Salary } from "@/types/salary.types";
import { SALARY_PAYMENT_MODES, SALARY_STATUSES } from "@/constants/enums";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function SalariesPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [payId, setPayId] = useState<string | null>(null);
  const [adjustSalary, setAdjustSalary] = useState<Salary | null>(null);

  const params = {
    page,
    limit: 20,
    status: status !== "all" ? (status as Salary["status"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["salaries", params],
    queryFn: () => salariesApi.getAll(params),
  });

  const columns = useMemo<ColumnDef<Salary>[]>(
    () => [
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => row.original.employee?.full_name ?? "—",
      },
      {
        id: "period",
        header: "Period",
        cell: ({ row }) => {
          const month = MONTHS.find((m) => m.value === row.original.month)?.label ?? row.original.month;
          return `${month} ${row.original.year}`;
        },
      },
      {
        accessorKey: "base_salary",
        header: "Base",
        cell: ({ row }) => formatCurrency(row.original.base_salary),
      },
      {
        id: "bonus",
        header: "Bonus",
        cell: ({ row }) =>
          row.original.bonus ? (
            <span className="text-green-600">+{formatCurrency(row.original.bonus)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "deductions",
        header: "Deductions",
        cell: ({ row }) =>
          row.original.deductions ? (
            <span className="text-destructive">−{formatCurrency(row.original.deductions)}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        accessorKey: "net_salary",
        header: "Net",
        cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.net_salary)}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "payment_date",
        header: "Paid On",
        cell: ({ row }) => formatDate(row.original.payment_date),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <PermissionGate module="salary" action="update">
              <Button
                size="sm"
                variant="ghost"
                title="Adjust bonus / deductions"
                onClick={() => setAdjustSalary(row.original)}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </PermissionGate>
            {row.original.status === "pending" && (
              <PermissionGate module="salary" action="update">
                <Button size="sm" variant="outline" onClick={() => setPayId(row.original._id)}>
                  Pay
                </Button>
              </PermissionGate>
            )}
          </div>
        ),
      },
    ],
    []
  );

  return (
    <ProtectedRoute module="salary">
      <div className="space-y-6">
        <PageHeader
          title="Salaries"
          description="Manage employee salary records and payments."
          actions={
            <PermissionGate module="salary" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Salary Record
              </Button>
            </PermissionGate>
          }
        />

        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SALARY_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} exportFileName="salaries" />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <SalaryFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <PaySalaryDialog salaryId={payId} onClose={() => setPayId(null)} />
      <AdjustSalaryDialog salary={adjustSalary} onClose={() => setAdjustSalary(null)} />
    </ProtectedRoute>
  );
}

function SalaryFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState({
    employee_id: "",
    month: String(new Date().getMonth() + 1),
    year: String(currentYear),
    base_salary: "",
    bonus: "",
    deductions: "",
    notes: "",
  });

  const { data: employees } = useQuery({
    queryKey: ["employees", "dropdown"],
    queryFn: () => employeesApi.getAll({ limit: 100 }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      salariesApi.create({
        employee_id: form.employee_id,
        month: Number(form.month),
        year: Number(form.year),
        base_salary: Number(form.base_salary),
        bonus: form.bonus ? Number(form.bonus) : undefined,
        deductions: form.deductions ? Number(form.deductions) : undefined,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Salary record created");
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Create Salary Record</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Employee *</Label>
            <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v ?? "" })}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {(employees?.data ?? []).map((e) => (
                  <SelectItem key={e._id} value={e._id}>{e.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Month *</Label>
              <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v ?? "" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Year *</Label>
              <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Base Salary *</Label>
              <Input type="number" value={form.base_salary} onChange={(e) => setForm({ ...form, base_salary: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Bonus</Label>
              <Input type="number" value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Deductions</Label>
              <Input type="number" value={form.deductions} onChange={(e) => setForm({ ...form, deductions: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!form.employee_id || !form.base_salary || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Create Record"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── AdjustSalaryDialog ───────────────────────────────────────────────────────

function AdjustSalaryDialog({
  salary,
  onClose,
}: {
  salary: Salary | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [bonus, setBonus] = useState("");
  const [deductions, setDeductions] = useState("");

  const month = MONTHS.find((m) => m.value === salary?.month)?.label ?? salary?.month;
  const bonusNum = Number(bonus) || 0;
  const deductionsNum = Number(deductions) || 0;
  const previewNet = (salary?.base_salary ?? 0) + bonusNum - deductionsNum;

  // Sync form fields whenever a different salary entry is opened
  useEffect(() => {
    if (salary) {
      setBonus(salary.bonus != null ? String(salary.bonus) : "");
      setDeductions(salary.deductions != null ? String(salary.deductions) : "");
    }
  }, [salary?._id]);

  const handleOpenChange = (open: boolean) => {
    if (!open) onClose();
  };

  const mutation = useMutation({
    mutationFn: () =>
      salariesApi.update(salary!._id, {
        bonus: bonusNum > 0 ? bonusNum : undefined,
        deductions: deductionsNum > 0 ? deductionsNum : undefined,
      }),
    onSuccess: () => {
      toast.success("Salary adjustments saved");
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      onClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={!!salary} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Bonus & Deductions</DialogTitle>
        </DialogHeader>

        {salary && (
          <div className="space-y-5">
            {/* Context */}
            <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Employee</span>
                <span className="font-medium">{salary.employee?.full_name ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Period</span>
                <span className="font-medium">{month} {salary.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Salary</span>
                <span className="font-medium">{formatCurrency(salary.base_salary)}</span>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonus</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={bonus}
                  onChange={(e) => setBonus(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Deductions</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={deductions}
                  onChange={(e) => setDeductions(e.target.value)}
                />
              </div>
            </div>

            {/* Net preview */}
            <div className="rounded-lg border px-4 py-3 text-sm space-y-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>Base</span>
                <span>{formatCurrency(salary.base_salary)}</span>
              </div>
              {bonusNum > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>+ Bonus</span>
                  <span>+{formatCurrency(bonusNum)}</span>
                </div>
              )}
              {deductionsNum > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>− Deductions</span>
                  <span>−{formatCurrency(deductionsNum)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Net Salary</span>
                <span>{formatCurrency(previewNet)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Saving..." : "Save Adjustments"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── PaySalaryDialog ──────────────────────────────────────────────────────────

function PaySalaryDialog({ salaryId, onClose }: { salaryId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    payment_mode: "bank_transfer" as Salary["payment_mode"],
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      salariesApi.pay(salaryId!, {
        payment_mode: form.payment_mode!,
        payment_date: form.payment_date,
        notes: form.notes || undefined,
      }),
    onSuccess: () => {
      toast.success("Salary marked as paid");
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      onClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={!!salaryId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Pay Salary</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select value={form.payment_mode} onValueChange={(v) => v && setForm({ ...form, payment_mode: v as Salary["payment_mode"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SALARY_PAYMENT_MODES.map((m) => (
                  <SelectItem key={m} value={m}>{formatLabel(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button className="w-full" disabled={!form.payment_date || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Processing..." : "Confirm Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
