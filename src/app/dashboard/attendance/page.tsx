"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { LogIn, LogOut, Clock, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { attendanceApi } from "@/services/api/attendance.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { DataTable } from "@/components/tables/data-table";
import { PaginationControls } from "@/components/tables/pagination-controls";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/utils/format";
import type { Attendance, AttendanceSession } from "@/types/attendance.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ─── TodayCard ────────────────────────────────────────────────────────────────

function TodayCard() {
  const queryClient = useQueryClient();

  const { data: today, isLoading } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: attendanceApi.getToday,
    retry: false,
  });

  const checkinMutation = useMutation({
    mutationFn: attendanceApi.checkin,
    onSuccess: () => {
      toast.success("Checked in successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const checkoutMutation = useMutation({
    mutationFn: attendanceApi.checkout,
    onSuccess: () => {
      toast.success("Checked out successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const isCheckedIn = today?.is_checked_in ?? false;
  const totalMinutes = today?.total_minutes ?? 0;
  const sessions: AttendanceSession[] = today?.sessions ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            Today — {new Intl.DateTimeFormat("en-IN", { dateStyle: "full" }).format(new Date())}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isCheckedIn ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Checked In
              </span>
            ) : (
              <span className="flex items-center gap-1 text-muted-foreground">
                <XCircle className="h-4 w-4" /> Not Checked In
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          {isCheckedIn ? (
            <Button
              variant="destructive"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {checkoutMutation.isPending ? "Checking Out..." : "Check Out"}
            </Button>
          ) : (
            <Button
              onClick={() => checkinMutation.mutate()}
              disabled={checkinMutation.isPending}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {checkinMutation.isPending ? "Checking In..." : "Check In"}
            </Button>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{formatMinutes(totalMinutes)}</span>
            <span className="text-muted-foreground">total today</span>
          </div>
        </div>

        {sessions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sessions
              </p>
              <div className="space-y-1">
                {sessions.map((s, i) => (
                  <div
                    key={s._id ?? i}
                    className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                  >
                    <span className="text-muted-foreground">Session {i + 1}</span>
                    <span>
                      {formatTime(s.check_in)}
                      {" → "}
                      {s.check_out ? formatTime(s.check_out) : (
                        <span className="text-green-600 font-medium">Active</span>
                      )}
                    </span>
                    <span className="text-muted-foreground">
                      {s.duration_minutes != null ? formatMinutes(s.duration_minutes) : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── AttendancePage ───────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const params = {
    page,
    limit: 20,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["attendance", "list", params],
    queryFn: () => attendanceApi.getAll(params),
  });

  const columns = useMemo<ColumnDef<Attendance>[]>(
    () => [
      {
        id: "employee",
        header: "Employee",
        cell: ({ row }) => row.original.employee?.full_name ?? "—",
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        id: "sessions",
        header: "Sessions",
        cell: ({ row }) => row.original.sessions.length,
      },
      {
        id: "total",
        header: "Total Time",
        cell: ({ row }) => formatMinutes(row.original.total_minutes),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) =>
          row.original.is_checked_in ? (
            <Badge variant="secondary">Checked In</Badge>
          ) : (
            <Badge variant="outline">Checked Out</Badge>
          ),
      },
      {
        id: "first_in",
        header: "First In",
        cell: ({ row }) => {
          const first = row.original.sessions[0];
          return first ? formatTime(first.check_in) : "—";
        },
      },
      {
        id: "last_out",
        header: "Last Out",
        cell: ({ row }) => {
          const sessions = row.original.sessions;
          const last = sessions[sessions.length - 1];
          return last?.check_out ? formatTime(last.check_out) : "—";
        },
      },
    ],
    []
  );

  return (
    <ProtectedRoute module="attendance">
      <div className="space-y-6">
        <PageHeader
          title="Attendance"
          description="Track daily check-in and check-out records."
        />

        <TodayCard />

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              className="w-40"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              className="w-40"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateFrom(""); setDateTo(""); setPage(1); }}
            >
              Clear
            </Button>
          )}
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          exportFileName="attendance"
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>
    </ProtectedRoute>
  );
}
