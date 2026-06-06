"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { rolesApi } from "@/services/api/roles.api";
import { getApiErrorMessage } from "@/services/api/axios";
import type {
  ModulePermissions,
  PermissionAction,
  Role,
  UpdateRolePermissionsPayload,
} from "@/types/role.types";
import { MODULES } from "@/constants/enums";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { DataTable } from "@/components/tables/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatDate } from "@/utils/format";

// ─── Permission helpers ────────────────────────────────────────────────────────

const ACTIONS: PermissionAction[] = ["read", "create", "update", "delete"];

function emptyPermissions(): Record<string, ModulePermissions> {
  return Object.fromEntries(
    MODULES.map((m) => [m, { read: false, create: false, update: false, delete: false }])
  );
}

function mergeWithDefaults(
  existing?: Partial<Record<string, ModulePermissions>>
): Record<string, ModulePermissions> {
  const base = emptyPermissions();
  if (!existing) return base;
  for (const mod of MODULES) {
    if (existing[mod]) base[mod] = { ...base[mod], ...existing[mod] };
  }
  return base;
}

// ─── PermissionsGrid ──────────────────────────────────────────────────────────

function PermissionsGrid({
  permissions,
  onChange,
}: {
  permissions: Record<string, ModulePermissions>;
  onChange: (p: Record<string, ModulePermissions>) => void;
}) {
  const toggle = (mod: string, action: PermissionAction) =>
    onChange({ ...permissions, [mod]: { ...permissions[mod], [action]: !permissions[mod][action] } });

  const toggleColumn = (action: PermissionAction) => {
    const allOn = MODULES.every((m) => permissions[m]?.[action]);
    onChange(
      Object.fromEntries(MODULES.map((m) => [m, { ...permissions[m], [action]: !allOn }]))
    );
  };

  const toggleRow = (mod: string) => {
    const allOn = ACTIONS.every((a) => permissions[mod]?.[a]);
    onChange({ ...permissions, [mod]: { read: !allOn, create: !allOn, update: !allOn, delete: !allOn } });
  };

  return (
    <div className="overflow-auto max-h-64 rounded-md border text-sm">
      <table className="w-full">
        <thead className="sticky top-0 z-10 bg-muted">
          <tr>
            <th className="w-36 px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              Module
            </th>
            {ACTIONS.map((action) => (
              <th key={action} className="w-16 px-2 py-2 text-center">
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs font-medium capitalize text-muted-foreground">
                    {action}
                  </span>
                  <Checkbox
                    checked={MODULES.every((m) => permissions[m]?.[action])}
                    onCheckedChange={() => toggleColumn(action)}
                  />
                </div>
              </th>
            ))}
            <th className="w-12 px-2 py-2 text-center">
              <span className="text-xs font-medium text-muted-foreground">All</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {MODULES.map((mod) => (
            <tr key={mod} className="border-t hover:bg-muted/30">
              <td className="px-3 py-2 capitalize">{mod.replace(/_/g, " ")}</td>
              {ACTIONS.map((action) => (
                <td key={action} className="px-2 py-2 text-center">
                  <Checkbox
                    checked={permissions[mod]?.[action] ?? false}
                    onCheckedChange={() => toggle(mod, action)}
                  />
                </td>
              ))}
              <td className="px-2 py-2 text-center">
                <Checkbox
                  checked={ACTIONS.every((a) => permissions[mod]?.[a])}
                  onCheckedChange={() => toggleRow(mod)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── RolesPage ────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<Role | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => rolesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      toast.success("Role deleted");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteId(null);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const filteredData = useMemo(() => {
    if (!search) return data ?? [];
    const q = search.toLowerCase();
    return (data ?? []).filter(
      (r) => r.name.toLowerCase().includes(q) || (r.description ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      { accessorKey: "name", header: "Role" },
      { accessorKey: "description", header: "Description" },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) =>
          row.original.is_system ? <Badge variant="outline">System</Badge> : <Badge>Custom</Badge>,
      },
      {
        id: "modules",
        header: "Modules",
        cell: ({ row }) => {
          const count = Object.keys(row.original.permissions ?? {}).length;
          return `${count} module${count !== 1 ? "s" : ""}`;
        },
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          !row.original.is_system ? (
            <div className="flex items-center gap-1">
              <PermissionGate module="roles" action="update">
                <Button
                  size="sm"
                  variant="ghost"
                  title="Edit permissions"
                  onClick={() => setEditRole(row.original)}
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PermissionGate>
              <PermissionGate module="roles" action="delete">
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(row.original._id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </PermissionGate>
            </div>
          ) : null,
      },
    ],
    []
  );

  return (
    <ProtectedRoute module="roles">
      <div className="space-y-6">
        <PageHeader
          title="Role Management"
          description="Define roles and module permissions."
          actions={
            <PermissionGate module="roles" action="create">
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </PermissionGate>
          }
        />

        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search roles..."
          exportFileName="roles"
        />
      </div>

      <RoleFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <EditPermissionsDialog role={editRole} onClose={() => setEditRole(null)} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
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

// ─── RoleFormDialog ───────────────────────────────────────────────────────────

const ROLE_NAME_RE = /^[a-z0-9_]+$/;

function slugifyRoleName(raw: string) {
  return raw
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function RoleFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Record<string, ModulePermissions>>(emptyPermissions);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setName("");
      setDescription("");
      setPermissions(emptyPermissions());
    }
    onOpenChange(o);
  };

  const nameInvalid = name.length > 0 && !ROLE_NAME_RE.test(name);

  const mutation = useMutation({
    mutationFn: () =>
      rolesApi.create({
        name,
        description: description || undefined,
        permissions: permissions as UpdateRolePermissionsPayload["permissions"],
      }),
    onSuccess: () => {
      toast.success("Role created");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      handleOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(slugifyRoleName(e.target.value))}
                placeholder="e.g. finance_manager"
                className={nameInvalid ? "border-destructive" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase, numbers and underscores only — spaces are auto-converted.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Permissions</Label>
            <p className="text-xs text-muted-foreground">
              Use the column headers to toggle all modules for an action, or the row checkbox to
              grant/revoke all actions for a module.
            </p>
            <PermissionsGrid permissions={permissions} onChange={setPermissions} />
          </div>

          <Button
            className="w-full"
            disabled={!name || nameInvalid || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Creating..." : "Create Role"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── EditPermissionsDialog ────────────────────────────────────────────────────

function EditPermissionsDialog({
  role,
  onClose,
}: {
  role: Role | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState<Record<string, ModulePermissions>>(emptyPermissions);

  useEffect(() => {
    setPermissions(
      mergeWithDefaults(role?.permissions as Record<string, ModulePermissions> | undefined)
    );
  }, [role]);

  const mutation = useMutation({
    mutationFn: () =>
      rolesApi.updatePermissions(role!._id, {
        permissions: permissions as UpdateRolePermissionsPayload["permissions"],
      }),
    onSuccess: () => {
      toast.success("Permissions updated");
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      onClose();
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={!!role} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Permissions — {role?.name}</DialogTitle>
        </DialogHeader>
        <PermissionsGrid permissions={permissions} onChange={setPermissions} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Saving..." : "Save Permissions"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
