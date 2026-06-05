"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { communicationsApi, type Communication } from "@/services/api/communications.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { COMMUNICATION_TYPES, ENTITY_TYPES } from "@/constants/enums";
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
import { formatDate, formatLabel } from "@/utils/format";

export default function CommunicationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string>("all");
  const [commType, setCommType] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    entity_type: entityType !== "all" ? (entityType as Communication["entity_type"]) : undefined,
    type: commType !== "all" ? (commType as Communication["type"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["communications", params],
    queryFn: () => communicationsApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => communicationsApi.delete(id),
    onSuccess: () => {
      toast.success("Communication deleted");
      queryClient.invalidateQueries({ queryKey: ["communications"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Communication>[]>(
    () => [
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => <Badge variant="outline">{formatLabel(row.original.type)}</Badge>,
      },
      {
        accessorKey: "entity_type",
        header: "Entity",
        cell: ({ row }) => formatLabel(row.original.entity_type),
      },
      {
        accessorKey: "date",
        header: "Date",
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        id: "user",
        header: "User",
        cell: ({ row }) => row.original.user?.name ?? "—",
      },
      {
        accessorKey: "outcome",
        header: "Outcome",
        cell: ({ row }) => row.original.outcome ?? "—",
      },
      {
        accessorKey: "next_follow_up_date",
        header: "Follow Up",
        cell: ({ row }) => formatDate(row.original.next_follow_up_date),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <PermissionGate module="communications" action="delete">
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
    <ProtectedRoute module="communications">
      <div className="space-y-6">
        <PageHeader
          title="Communications"
          description="Log calls, emails, and meetings with leads and clients."
          actions={
            <PermissionGate module="communications" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Communication
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex flex-wrap gap-2">
          <Select value={entityType} onValueChange={(v) => { setEntityType(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Entity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All entities</SelectItem>
              {ENTITY_TYPES.map((e) => (
                <SelectItem key={e} value={e}>{formatLabel(e)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={commType} onValueChange={(v) => { setCommType(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {COMMUNICATION_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} exportFileName="communications" />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <CommunicationFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete communication?</AlertDialogTitle>
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

function CommunicationFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    entity_type: "lead" as Communication["entity_type"],
    entity_id: "",
    date: new Date().toISOString().split("T")[0],
    type: "call" as Communication["type"],
    notes: "",
    outcome: "",
    next_follow_up_date: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      communicationsApi.create({
        entity_type: form.entity_type,
        entity_id: form.entity_id,
        date: form.date,
        type: form.type,
        notes: form.notes || undefined,
        outcome: form.outcome || undefined,
        next_follow_up_date: form.next_follow_up_date || undefined,
      }),
    onSuccess: () => {
      toast.success("Communication logged");
      queryClient.invalidateQueries({ queryKey: ["communications"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Log Communication</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Entity Type *</Label>
              <Select value={form.entity_type} onValueChange={(v) => v && setForm({ ...form, entity_type: v as Communication["entity_type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>{formatLabel(e)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Communication Type *</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as Communication["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMMUNICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Entity ID *</Label>
            <Input value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} placeholder="Lead or Client ID" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Follow Up Date</Label>
              <Input type="date" value={form.next_follow_up_date} onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Outcome</Label>
            <Input value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!form.entity_id || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving..." : "Log Communication"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
