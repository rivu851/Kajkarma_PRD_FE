"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, LayoutGrid, Table2 } from "lucide-react";
import { toast } from "sonner";
import { leadsApi } from "@/services/api/leads.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { Lead } from "@/types/lead.types";
import { LEAD_STAGES, LEAD_STATUSES } from "@/constants/enums";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatLabel } from "@/utils/format";
import { ROUTES } from "@/constants/routes";
import { LeadFormDialog } from "@/components/forms/lead-form-dialog";

export default function LeadsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [formOpen, setFormOpen] = useState(false);

  const params = {
    page,
    limit: 20,
    search: search || undefined,
    stage: stage !== "all" ? (stage as Lead["stage"]) : undefined,
    status: status !== "all" ? (status as Lead["status"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["leads", params],
    queryFn: () => leadsApi.getAll(params),
  });

  const convertMutation = useMutation({
    mutationFn: (id: string) => leadsApi.convert(id),
    onSuccess: () => {
      toast.success("Lead converted to client");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: "lead_name",
        header: "Lead Name",
        cell: ({ row }) => (
          <Link href={`${ROUTES.leads}/${row.original._id}`} className="font-medium hover:underline">
            {row.original.lead_name}
          </Link>
        ),
      },
      { accessorKey: "company_name", header: "Company" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone_number", header: "Phone" },
      {
        accessorKey: "stage",
        header: "Stage",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.stage)}</Badge>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        id: "assigned_user",
        header: "Assigned User",
        cell: ({ row }) => row.original.assigned_user?.name ?? "—",
      },
      {
        accessorKey: "follow_up_date",
        header: "Follow Up",
        cell: ({ row }) => formatDate(row.original.follow_up_date),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          row.original.stage === "won" ? (
            <PermissionGate module="leads" action="update">
              <Button
                size="sm"
                variant="outline"
                onClick={() => convertMutation.mutate(row.original._id)}
                disabled={convertMutation.isPending}
              >
                Convert
              </Button>
            </PermissionGate>
          ) : null,
      },
    ],
    [convertMutation]
  );

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    LEAD_STAGES.forEach((s) => {
      grouped[s] = [];
    });
    data?.data.forEach((lead) => {
      grouped[lead.stage]?.push(lead);
    });
    return grouped;
  }, [data?.data]);

  return (
    <ProtectedRoute module="leads">
      <div className="space-y-6">
        <PageHeader
          title="Lead Management"
          description="Manage sales pipeline with table and kanban views."
          actions={
            <PermissionGate module="leads" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Lead
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={stage} onValueChange={(v) => { setStage(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                {LEAD_STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")}>
            <TabsList>
              <TabsTrigger value="table"><Table2 className="mr-2 h-4 w-4" />Table</TabsTrigger>
              <TabsTrigger value="kanban"><LayoutGrid className="mr-2 h-4 w-4" />Kanban</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {view === "table" ? (
          <>
            <DataTable
              columns={columns}
              data={data?.data ?? []}
              isLoading={isLoading}
              searchValue={search}
              onSearchChange={(v) => { setSearch(v); setPage(1); }}
              searchPlaceholder="Search leads..."
              exportFileName="leads"
            />
            <PaginationControls
              page={data?.page ?? 1}
              totalPages={data?.totalPages ?? 1}
              total={data?.total}
              onPageChange={setPage}
            />
          </>
        ) : (
          <div className="grid gap-4 overflow-x-auto md:grid-cols-3 xl:grid-cols-6">
            {LEAD_STAGES.map((stageKey) => (
              <Card key={stageKey} className="min-w-[220px]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{formatLabel(stageKey)}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(leadsByStage[stageKey] ?? []).map((lead) => (
                    <Link
                      key={lead._id}
                      href={`${ROUTES.leads}/${lead._id}`}
                      className="block rounded-lg border p-3 text-sm hover:bg-muted/50"
                    >
                      <p className="font-medium">{lead.lead_name}</p>
                      <p className="text-xs text-muted-foreground">{lead.company_name}</p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <LeadFormDialog open={formOpen} onOpenChange={setFormOpen} />
    </ProtectedRoute>
  );
}
