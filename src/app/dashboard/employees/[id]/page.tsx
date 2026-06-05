"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { employeesApi } from "@/services/api/employees.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { useCanViewSensitiveEmployeeData } from "@/hooks/use-sensitive-employee";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatLabel, maskSensitiveValue } from "@/utils/format";
import { EMPLOYEE_STATUSES } from "@/constants/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employee } from "@/types/employee.types";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const canViewSensitive = useCanViewSensitiveEmployeeData();

  const { data: employee, isLoading } = useQuery({
    queryKey: ["employees", id],
    queryFn: () => employeesApi.getById(id),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: Employee["status"]) => employeesApi.update(id, { status }),
    onSuccess: () => {
      toast.success("Status updated");
      queryClient.invalidateQueries({ queryKey: ["employees", id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!employee) return <p>Employee not found</p>;

  const salaryDisplay =
    canViewSensitive && employee.salary != null
      ? formatCurrency(employee.salary)
      : "••••••";

  return (
    <ProtectedRoute module="employees">
      <div className="space-y-6">
        <PageHeader title={employee.full_name} description={`${employee.department} · ${employee.role_designation}`} />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><span className="text-muted-foreground">Email:</span> {employee.email ?? "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {employee.phone_number ?? "—"}</div>
              <div><span className="text-muted-foreground">DOB:</span> {formatDate(employee.date_of_birth)}</div>
              <div><span className="text-muted-foreground">Joined:</span> {formatDate(employee.joining_date)}</div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge>{formatLabel(employee.status)}</Badge>
              </div>
              <div><span className="text-muted-foreground">Salary:</span> {salaryDisplay}</div>
              {canViewSensitive ? (
                <div><span className="text-muted-foreground">Pending Salary:</span> {employee.pending_salary != null ? formatCurrency(employee.pending_salary) : "—"}</div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Update Status</CardTitle></CardHeader>
            <CardContent>
              <PermissionGate module="employees" action="update">
                <Select value={employee.status} onValueChange={(v) => v && statusMutation.mutate(v as Employee["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYEE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PermissionGate>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Bank Details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Account Holder:</span>{" "}
              {canViewSensitive ? (employee.bank_account_holder ?? "—") : "••••••"}
            </div>
            <div>
              <span className="text-muted-foreground">Bank:</span>{" "}
              {canViewSensitive ? (employee.bank_name ?? "—") : "••••••"}
            </div>
            <div>
              <span className="text-muted-foreground">Account Number:</span>{" "}
              {canViewSensitive ? (employee.account_number ?? "—") : maskSensitiveValue(employee.account_number)}
            </div>
            <div>
              <span className="text-muted-foreground">IFSC:</span>{" "}
              {canViewSensitive ? (employee.ifsc_code ?? "—") : maskSensitiveValue(employee.ifsc_code)}
            </div>
            <div>
              <span className="text-muted-foreground">Branch:</span>{" "}
              {canViewSensitive ? (employee.branch_name ?? "—") : "••••••"}
            </div>
            <div>
              <span className="text-muted-foreground">UPI ID:</span>{" "}
              {canViewSensitive ? (employee.upi_id ?? "—") : maskSensitiveValue(employee.upi_id)}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
