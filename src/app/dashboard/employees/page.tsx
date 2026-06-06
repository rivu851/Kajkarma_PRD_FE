"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Trash2, Eye, EyeOff, Pencil } from "lucide-react";
import { toast } from "sonner";
import { employeesApi } from "@/services/api/employees.api";
import { rolesApi } from "@/services/api/roles.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { CreateEmployeePayload, Employee } from "@/types/employee.types";
import { EMPLOYEE_STATUSES } from "@/constants/enums";
import { useCanViewSensitiveEmployeeData } from "@/hooks/use-sensitive-employee";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DataTable } from "@/components/tables/data-table";
import { PaginationControls } from "@/components/tables/pagination-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();
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
          <div className="flex gap-1">
            <PermissionGate module="employees" action="update">
              <Button size="sm" variant="ghost" onClick={() => setEditingEmployee(row.original)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            <PermissionGate module="employees" action="delete">
              <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original._id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </PermissionGate>
          </div>
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
      <EmployeeFormDialog
        open={!!editingEmployee}
        onOpenChange={(o) => !o && setEditingEmployee(undefined)}
        employee={editingEmployee}
      />

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

interface EmployeeFormDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  employee?: Employee;
}

function EmployeeFormDialog({ open, onOpenChange, employee }: EmployeeFormDialogProps) {
  const queryClient = useQueryClient();
  const canViewSensitive = useCanViewSensitiveEmployeeData();
  const isEdit = !!employee;

  const [userMode, setUserMode] = useState<"select" | "create">("select");
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    department: "",
    role_designation: "",
    joining_date: "",
    salary: "",
    status: "" as Employee["status"] | "",
    phone_number: "",
    email: "",
    date_of_birth: "",
  });

  const [bankForm, setBankForm] = useState({
    bank_account_holder: "",
    bank_name: "",
    account_number: "",
    ifsc_code: "",
    branch_name: "",
    upi_id: "",
  });

  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", role_id: "" });

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.getAll,
  });

  const { data: roleUsersData } = useQuery({
    queryKey: ["roles", selectedRoleId, "users"],
    queryFn: () => rolesApi.getUsers(selectedRoleId),
    enabled: !!selectedRoleId && userMode === "select" && !isEdit,
  });

  useEffect(() => {
    if (open && employee) {
      setForm({
        full_name: employee.full_name ?? "",
        department: employee.department ?? "",
        role_designation: employee.role_designation ?? "",
        joining_date: employee.joining_date ? employee.joining_date.slice(0, 10) : "",
        salary: employee.salary != null ? String(employee.salary) : "",
        status: employee.status ?? "",
        phone_number: employee.phone_number ?? "",
        email: employee.email ?? "",
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.slice(0, 10) : "",
      });
      setBankForm({
        bank_account_holder: employee.bank_account_holder ?? "",
        bank_name: employee.bank_name ?? "",
        account_number: employee.account_number ?? "",
        ifsc_code: employee.ifsc_code ?? "",
        branch_name: employee.branch_name ?? "",
        upi_id: employee.upi_id ?? "",
      });
    } else if (!open) {
      resetForm();
    }
  }, [open, employee]);

  const resetForm = () => {
    setForm({ full_name: "", department: "", role_designation: "", joining_date: "", salary: "", status: "", phone_number: "", email: "", date_of_birth: "" });
    setBankForm({ bank_account_holder: "", bank_name: "", account_number: "", ifsc_code: "", branch_name: "", upi_id: "" });
    setSelectedRoleId("");
    setSelectedUserId("");
    setNewUser({ email: "", password: "", role_id: "" });
    setUserMode("select");
    setShowPassword(false);
  };

  const buildPayload = (): Partial<CreateEmployeePayload> => {
    const base: Partial<CreateEmployeePayload> = {
      full_name: form.full_name,
      department: form.department,
      role_designation: form.role_designation,
      joining_date: form.joining_date,
      phone_number: form.phone_number || undefined,
      email: form.email || undefined,
      date_of_birth: form.date_of_birth || undefined,
      status: form.status || undefined,
    };
    if (canViewSensitive) {
      if (form.salary) base.salary = Number(form.salary);
      Object.assign(base, {
        bank_account_holder: bankForm.bank_account_holder || undefined,
        bank_name: bankForm.bank_name || undefined,
        account_number: bankForm.account_number || undefined,
        ifsc_code: bankForm.ifsc_code || undefined,
        branch_name: bankForm.branch_name || undefined,
        upi_id: bankForm.upi_id || undefined,
      });
    }
    return base;
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (isEdit) {
        return employeesApi.update(employee._id, buildPayload());
      }
      const payload = buildPayload() as CreateEmployeePayload;
      if (userMode === "select") {
        return employeesApi.create({ ...payload, user_id: selectedUserId || undefined });
      }
      return employeesApi.create({
        ...payload,
        create_user_account: {
          email: newUser.email,
          password: newUser.password,
          role_id: newUser.role_id,
        },
      });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Employee updated" : "Employee created");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      if (employee) queryClient.invalidateQueries({ queryKey: ["employees", employee._id] });
      resetForm();
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const isSelectModeValid = !!selectedUserId;
  const isCreateModeValid = !!newUser.email && !!newUser.password && !!newUser.role_id;
  const canSubmit =
    !!form.full_name && !!form.department && !!form.role_designation && !!form.joining_date &&
    (isEdit || (userMode === "select" ? isSelectModeValid : isCreateModeValid));

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Employee" : "Create Employee"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">

          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
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

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Joining Date *</Label>
              <Input type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Date of Birth</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} placeholder="+91..." />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          {isEdit && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Employee["status"] })}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {EMPLOYEE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {canViewSensitive && (
            <>
              <div className="space-y-2">
                <Label>Salary</Label>
                <Input type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
              </div>

              <div className="space-y-3 rounded-lg border p-4">
                <Label className="text-sm font-medium">Bank Details</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Account Holder</Label>
                    <Input value={bankForm.bank_account_holder} onChange={(e) => setBankForm({ ...bankForm, bank_account_holder: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bank Name</Label>
                    <Input value={bankForm.bank_name} onChange={(e) => setBankForm({ ...bankForm, bank_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Account Number</Label>
                    <Input value={bankForm.account_number} onChange={(e) => setBankForm({ ...bankForm, account_number: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">IFSC Code</Label>
                    <Input value={bankForm.ifsc_code} onChange={(e) => setBankForm({ ...bankForm, ifsc_code: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Branch Name</Label>
                    <Input value={bankForm.branch_name} onChange={(e) => setBankForm({ ...bankForm, branch_name: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">UPI ID</Label>
                    <Input value={bankForm.upi_id} onChange={(e) => setBankForm({ ...bankForm, upi_id: e.target.value })} />
                  </div>
                </div>
              </div>
            </>
          )}

          {!isEdit && (
            <div className="space-y-3 rounded-lg border p-4">
              <Label className="text-sm font-medium">User Account</Label>
              <Tabs value={userMode} onValueChange={(v: string | null) => v && setUserMode(v as "select" | "create")}>
                <TabsList className="w-full">
                  <TabsTrigger value="select" className="flex-1">Select Existing User</TabsTrigger>
                  <TabsTrigger value="create" className="flex-1">Create New User</TabsTrigger>
                </TabsList>
              </Tabs>

              {userMode === "select" ? (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Filter by role, then pick a user</Label>
                  <div className="flex gap-2">
                    <Select value={selectedRoleId} onValueChange={(v: string | null) => { setSelectedRoleId(v ?? ""); setSelectedUserId(""); }}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesData?.map((r) => (
                          <SelectItem key={r._id} value={r._id}>{formatLabel(r.name)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedRoleId && (
                      <Select value={selectedUserId} onValueChange={(v: string | null) => setSelectedUserId(v ?? "")}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {!roleUsersData?.length && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No users</div>
                          )}
                          {roleUsersData?.map((u) => (
                            <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="employee@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Min. 8 characters"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select value={newUser.role_id} onValueChange={(v: string | null) => setNewUser({ ...newUser, role_id: v ?? "" })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesData?.map((r) => (
                          <SelectItem key={r._id} value={r._id}>{formatLabel(r.name)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? (isEdit ? "Saving..." : "Creating...")
              : (isEdit ? "Save Changes" : "Create Employee")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
