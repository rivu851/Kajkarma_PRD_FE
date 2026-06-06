"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { clientsApi } from "@/services/api/clients.api";
import { rolesApi } from "@/services/api/roles.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type { Client } from "@/types/client.types";
import { CLIENT_STATUSES } from "@/constants/enums";
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
import { ROUTES } from "@/constants/routes";

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const params = {
    page,
    limit: 20,
    search: search || undefined,
    status: status !== "all" ? (status as Client["status"]) : undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["clients", params],
    queryFn: () => clientsApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      toast.success("Client deleted");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "company_name",
        header: "Company",
        cell: ({ row }) => (
          <Link href={`${ROUTES.clients}/${row.original._id}`} className="font-medium hover:underline">
            {row.original.company_name}
          </Link>
        ),
      },
      { accessorKey: "contact_person_name", header: "Contact" },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone_number", header: "Phone" },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <Badge>{formatLabel(row.original.status)}</Badge>,
      },
      {
        id: "assigned_manager",
        header: "Manager",
        cell: ({ row }) => row.original.assigned_manager?.name ?? "—",
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <PermissionGate module="clients" action="update">
              <Button
                size="sm"
                variant="ghost"
                title="Edit client"
                onClick={() => { setEditingClient(row.original); setFormOpen(true); }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </PermissionGate>
            <PermissionGate module="clients" action="delete">
              <Button size="sm" variant="ghost" title="Delete client" onClick={() => setDeleteId(row.original._id)}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <ProtectedRoute module="clients">
      <div className="space-y-6">
        <PageHeader
          title="Client Management"
          description="Manage client accounts and relationships."
          actions={
            <PermissionGate module="clients" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Client
              </Button>
            </PermissionGate>
          }
        />

        <Select value={status} onValueChange={(v) => { setStatus(v ?? "all"); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {CLIENT_STATUSES.map((s) => (
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
          searchPlaceholder="Search clients..."
          exportFileName="clients"
        />
        <PaginationControls
          page={data?.page ?? 1}
          totalPages={data?.totalPages ?? 1}
          total={data?.total}
          onPageChange={setPage}
        />
      </div>

      <ClientFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditingClient(undefined); }}
        client={editingClient}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete client?</AlertDialogTitle>
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

function ClientFormDialog({
  open,
  onOpenChange,
  client,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  client?: Client;
}) {
  const isEdit = !!client;
  const queryClient = useQueryClient();

  const emptyForm = {
    company_name: "",
    contact_person_name: "",
    email: "",
    phone_number: "",
    website_link: "",
    sector: "",
    address: "",
    status: "active" as Client["status"],
    notes: "",
  };

  const [form, setForm] = useState(emptyForm);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [assignedManagerId, setAssignedManagerId] = useState("");

  // Populate form when editing
  useEffect(() => {
    if (open && client) {
      setForm({
        company_name: client.company_name,
        contact_person_name: client.contact_person_name,
        email: client.email ?? "",
        phone_number: client.phone_number ?? "",
        website_link: client.website_link ?? "",
        sector: client.sector ?? "",
        address: client.address ?? "",
        status: client.status,
        notes: client.notes ?? "",
      });
      setAssignedManagerId(client.assigned_manager_id ?? "");
    } else if (open && !client) {
      setForm(emptyForm);
      setSelectedRoleId("");
      setAssignedManagerId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?._id]);

  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.getAll,
    enabled: open,
  });

  const { data: roleUsersData } = useQuery({
    queryKey: ["roles", selectedRoleId, "users"],
    queryFn: () => rolesApi.getUsers(selectedRoleId),
    enabled: !!selectedRoleId,
  });

  const reset = () => {
    setForm(emptyForm);
    setSelectedRoleId("");
    setAssignedManagerId("");
  };

  const payload = {
    company_name: form.company_name,
    contact_person_name: form.contact_person_name,
    email: form.email || undefined,
    phone_number: form.phone_number || undefined,
    website_link: form.website_link || undefined,
    sector: form.sector || undefined,
    address: form.address || undefined,
    status: form.status,
    notes: form.notes || undefined,
    assigned_manager_id: assignedManagerId || undefined,
  };

  const mutation = useMutation({
    mutationFn: () => isEdit ? clientsApi.update(client!._id, payload) : clientsApi.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? "Client updated" : "Client created");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{isEdit ? "Edit Client" : "Create Client"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Company Name *</Label>
            <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Contact Person *</Label>
            <Input value={form.contact_person_name} onChange={(e) => setForm({ ...form, contact_person_name: e.target.value })} />
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
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website_link} onChange={(e) => setForm({ ...form, website_link: e.target.value })} placeholder="https://" />
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: string | null) => v && setForm({ ...form, status: v as Client["status"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CLIENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Assign Manager</Label>
            <div className="flex gap-2">
              <Select value={selectedRoleId} onValueChange={(v: string | null) => { setSelectedRoleId(v ?? ""); setAssignedManagerId(""); }}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {rolesData?.map((r) => (
                    <SelectItem key={r._id} value={r._id}>{formatLabel(r.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRoleId && (
                <Select value={assignedManagerId} onValueChange={(v: string | null) => setAssignedManagerId(v ?? "")}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="User" />
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
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button
            className="w-full"
            disabled={!form.company_name || !form.contact_person_name || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending
              ? isEdit ? "Saving..." : "Creating..."
              : isEdit ? "Save Changes" : "Create Client"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
