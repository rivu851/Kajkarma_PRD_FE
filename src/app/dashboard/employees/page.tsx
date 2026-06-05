"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { employeesApi } from "@/services/api/employees.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { Employee } from "@/types/employee.types";
import { EMPLOYEE_STATUSES } from "@/constants/enums";
import { useCanViewSensitiveEmployeeData } from "@/hooks/use-sensitive-employee";
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
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";
import { ROUTES } from "@/constants/routes";

export default function EmployeesPage() {
  const queryClient = useQueryClient();
  const canViewSensitive = useCanViewSensitiveEmployeeData();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    search: search || undefined,
    status: status !== "all" ? (status as Employee["status"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["employees", params],
    queryFn: () => employeesApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: () => {
      toast.success("Employee deleted");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        accessorKey: "full_name",
        header: "Name",
        cell: ({ row }) => (
          <Link href={`${ROUTES.employees}/${row.original._id}`} className="font-medium hover:underline">
            {row.original.full_name}
          </Link>
        ),
      },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "department", header: "Department" },
      { accessorKey: "role_designation", header: "Designation" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        accessorKey: "salary",
        header: "Salary",
        cell: ({ row }) =>
          canViewSensitive && row.original.salary != null
            ? formatCurrency(row.original.salary)
            : "••••••",
      },
      {
        accessorKey: "joining_date",
        header: "Joined",
        cell: ({ row }) => formatDate(row.original.joining_date),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <PermissionGate module="employees" action="delete">
            <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original._id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </PermissionGate>
        ),
      },
    ],
    [canViewSensitive]
  );

  return (
    <ProtectedRoute module="employees">
      <div className="space-y-6">
        <PageHeader
          title="Employee Management"
          description="Manage employee records and assignments."
          actions={
            <PermissionGate module="employees" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </PermissionGate>
          }
        />

        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {EMPLOYEE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search employees..."
          exportFileName="employees"
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <EmployeeFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
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

function EmployeeFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const canViewSensitive = useCanViewSensitiveEmployeeData();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    department: "",
    role_designation: "",
    joining_date: "",
    salary: "",
    status: "active" as Employee["status"],
  });

  const mutation = useMutation({
    mutationFn: () =>
      employeesApi.create({
        full_name: form.full_name,
        email: form.email || undefined,
        phone_number: form.phone_number || undefined,
        department: form.department,
        role_designation: form.role_designation,
        joining_date: form.joining_date,
        salary: canViewSensitive && form.salary ? Number(form.salary) : undefined,
        status: form.status,
      }),
    onSuccess: () => {
      toast.success("Employee created");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Create Employee</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Department *</Label>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Designation *</Label>
              <Input value={form.role_designation} onChange={(e) => setForm({ ...form, role_designation: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Joining Date *</Label>
            <Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
          </div>
          {canViewSensitive ? (
            <div className="space-y-2">
              <Label>Salary</Label>
              <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </div>
          ) : null}
          <Button
            className="w-full"
            disabled={!form.full_name || !form.department || !form.role_designation || !form.joining_date || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Create Employee"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
