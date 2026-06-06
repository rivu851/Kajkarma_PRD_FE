"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { communicationsApi, type Communication } from "@/services/api/communications.api";
import { leadsApi } from "@/services/api/leads.api";
import { clientsApi } from "@/services/api/clients.api";
import { usersApi } from "@/services/api/users.api";
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState<string>("all");
  const [commType, setCommType] = useState<string>("all");
  const [userId, setUserId] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<Communication | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: users } = useQuery({
    queryKey: ["users", { limit: 100 }],
    queryFn: () => usersApi.getAll({ limit: 100 }),
  });

  const params = {
    page,
    limit: 20,
    entity_type: entityType !== "all" ? (entityType as Communication["entity_type"]) : undefined,
    type: commType !== "all" ? (commType as Communication["type"]) : undefined,
    user_id: userId !== "all" ? userId : undefined,
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
        cell: ({ row }) => (
          <Badge variant="outline">{formatLabel(row.original.type)}</Badge>
        ),
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
        header: "Logged By",
        cell: ({ row }) => row.original.user?.name ?? "—",
      },
      {
        accessorKey: "outcome",
        header: "Outcome",
        cell: ({ row }) => row.original.outcome ?? "—",
      },
      {
        accessorKey: "notes",
        header: "Notes",
        cell: ({ row }) => {
          const n = row.original.notes;
          if (!n) return "—";
          return n.length > 60 ? n.slice(0, 60) + "…" : n;
        },
      },
      {
        accessorKey: "next_follow_up_date",
        header: "Follow Up",
        cell: ({ row }) => formatDate(row.original.next_follow_up_date) ?? "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-1">
            <PermissionGate module="communications" action="update">
              <Button
                size="sm"
                variant="ghost"
                title="Edit"
                onClick={() => setEditItem(row.original)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </PermissionGate>
            <PermissionGate module="communications" action="delete">
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

          <Select value={userId} onValueChange={(v) => { setUserId(v ?? "all"); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Logged by" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All users</SelectItem>
              {(users?.data ?? []).map((u) => (
                <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DataTable
          columns={columns}
          data={data?.data ?? []}
          isLoading={isLoading}
          exportFileName="communications"
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <CommunicationFormDialog open={formOpen} onOpenChange={setFormOpen} />
      <EditCommunicationDialog item={editItem} onClose={() => setEditItem(null)} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete communication?</AlertDialogTitle>
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

// ─── Entity picker ────────────────────────────────────────────────────────────
// Fetches leads or clients depending on entity_type and renders a Select.

function EntitySelect({
  entityType,
  value,
  onChange,
  disabled,
}: {
  entityType: Communication["entity_type"] | "";
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
}) {
  const { data: leads } = useQuery({
    queryKey: ["leads-dropdown"],
    queryFn: () => leadsApi.getAll({ limit: 200 }),
    enabled: entityType === "lead",
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-dropdown"],
    queryFn: () => clientsApi.getAll({ limit: 200 }),
    enabled: entityType === "client",
  });

  const options: { id: string; label: string }[] =
    entityType === "lead"
      ? (leads?.data ?? []).map((l) => ({ id: l._id, label: l.lead_name }))
      : entityType === "client"
        ? (clients?.data ?? []).map((c) => ({ id: c._id, label: c.company_name }))
        : [];

  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => onChange(v === "none" ? "" : (v ?? ""))}
      disabled={disabled || !entityType}
    >
      <SelectTrigger>
        <SelectValue
          placeholder={
            !entityType
              ? "Select entity type first"
              : entityType === "lead"
                ? "Select lead…"
                : "Select client…"
          }
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— Select —</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── CommunicationFormDialog ──────────────────────────────────────────────────

const EMPTY_CREATE_FORM = {
  entity_type: "lead" as Communication["entity_type"],
  entity_id: "",
  date: new Date().toISOString().split("T")[0],
  type: "call" as Communication["type"],
  notes: "",
  outcome: "",
  next_follow_up_date: "",
};

function CommunicationFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_CREATE_FORM);

  const handleOpenChange = (o: boolean) => {
    if (!o) setForm(EMPTY_CREATE_FORM);
    onOpenChange(o);
  };

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
      handleOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Log Communication</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Entity Type *</Label>
              <Select
                value={form.entity_type}
                onValueChange={(v) =>
                  v && setForm({ ...form, entity_type: v as Communication["entity_type"], entity_id: "" })
                }
              >
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
              <Select
                value={form.type}
                onValueChange={(v) => v && setForm({ ...form, type: v as Communication["type"] })}
              >
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
            <Label>{form.entity_type === "lead" ? "Lead" : "Client"} *</Label>
            <EntitySelect
              entityType={form.entity_type}
              value={form.entity_id}
              onChange={(id) => setForm({ ...form, entity_id: id })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Follow Up Date</Label>
              <Input
                type="date"
                value={form.next_follow_up_date}
                onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Outcome</Label>
            <Input
              value={form.outcome}
              onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              placeholder="e.g. Interested, Follow up needed…"
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            disabled={!form.entity_id || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Saving…" : "Log Communication"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── EditCommunicationDialog ──────────────────────────────────────────────────

const EMPTY_EDIT_FORM = {
  date: "",
  type: "call" as Communication["type"],
  notes: "",
  outcome: "",
  next_follow_up_date: "",
};

function EditCommunicationDialog({
  item,
  onClose,
}: {
  item: Communication | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_EDIT_FORM);

  useEffect(() => {
    if (item) {
      setForm({
        date: item.date?.split("T")[0] ?? new Date().toISOString().split("T")[0],
        type: item.type,
        notes: item.notes ?? "",
        outcome: item.outcome ?? "",
        next_follow_up_date: item.next_follow_up_date?.split("T")[0] ?? "",
      });
    }
  }, [item]);

  const handleClose = () => {
    setForm(EMPTY_EDIT_FORM);
    onClose();
  };

  const mutation = useMutation({
    mutationFn: () =>
      communicationsApi.update(item!._id, {
        date: form.date || undefined,
        type: form.type,
        notes: form.notes || undefined,
        outcome: form.outcome || undefined,
        // Send null to clear follow-up, or a date string to set it
        next_follow_up_date: form.next_follow_up_date || undefined,
      }),
    onSuccess: () => {
      toast.success("Communication updated");
      queryClient.invalidateQueries({ queryKey: ["communications"] });
      handleClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={!!item} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>Edit Communication</DialogTitle></DialogHeader>
        <div className="space-y-4">
          {/* Entity info is read-only */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Input value={formatLabel(item?.entity_type ?? "")} disabled />
            </div>
            <div className="space-y-2">
              <Label>Entity ID</Label>
              <Input value={item?.entity_id ?? ""} disabled />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Communication Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) => v && setForm({ ...form, type: v as Communication["type"] })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMMUNICATION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Follow Up Date</Label>
            <Input
              type="date"
              value={form.next_follow_up_date}
              onChange={(e) => setForm({ ...form, next_follow_up_date: e.target.value })}
            />
            {form.next_follow_up_date && (
              <button
                type="button"
                className="text-xs text-muted-foreground underline"
                onClick={() => setForm({ ...form, next_follow_up_date: "" })}
              >
                Clear follow-up date
              </button>
            )}
          </div>

          <div className="space-y-2">
            <Label>Outcome</Label>
            <Input
              value={form.outcome}
              onChange={(e) => setForm({ ...form, outcome: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
