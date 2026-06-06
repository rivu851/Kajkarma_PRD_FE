"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { leadsApi } from "@/services/api/leads.api";
import { rolesApi } from "@/services/api/roles.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, formatLabel } from "@/utils/format";
import { LEAD_STAGES } from "@/constants/enums";
import { ROUTES } from "@/constants/routes";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // notes
  const [note, setNote] = useState("");

  // stage update
  const [pendingStage, setPendingStage] = useState("");
  const [stageNote, setStageNote] = useState("");

  // assign
  const [assignRoleId, setAssignRoleId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");

  // delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["leads", id],
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
  });

  // sync pending stage when lead loads or stage changes externally
  useEffect(() => {
    if (lead) setPendingStage(lead.stage);
  }, [lead?.stage]);

  // roles + users for assign card
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.getAll,
  });

  const { data: assignRoleUsers } = useQuery({
    queryKey: ["roles", assignRoleId, "users"],
    queryFn: () => rolesApi.getUsers(assignRoleId),
    enabled: !!assignRoleId,
  });

  const stageMutation = useMutation({
    mutationFn: ({ stage, note: n }: { stage: string; note?: string }) =>
      leadsApi.updateStage(id, stage as never, n),
    onSuccess: () => {
      toast.success("Stage updated");
      setStageNote("");
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const noteMutation = useMutation({
    mutationFn: () => leadsApi.addNote(id, note),
    onSuccess: () => {
      toast.success("Note added");
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const assignMutation = useMutation({
    mutationFn: () => leadsApi.assign(id, assignUserId),
    onSuccess: () => {
      toast.success("Lead assigned");
      setAssignRoleId("");
      setAssignUserId("");
      queryClient.invalidateQueries({ queryKey: ["leads", id] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const convertMutation = useMutation({
    mutationFn: () => leadsApi.convert(id),
    onSuccess: () => {
      toast.success("Lead converted to client");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push(ROUTES.leads);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.delete(id),
    onSuccess: () => {
      toast.success("Lead deleted");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      router.push(ROUTES.leads);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!lead) return <p>Lead not found</p>;

  const stageChanged = pendingStage && pendingStage !== lead.stage;

  return (
    <ProtectedRoute module="leads">
      <div className="space-y-6">
        <PageHeader
          title={lead.lead_name}
          description={lead.company_name}
          actions={
            <div className="flex gap-2">
              {lead.stage === "won" && (
                <PermissionGate module="leads" action="update">
                  <Button
                    onClick={() => convertMutation.mutate()}
                    disabled={convertMutation.isPending}
                  >
                    {convertMutation.isPending ? "Converting..." : "Convert to Client"}
                  </Button>
                </PermissionGate>
              )}
              <PermissionGate module="leads" action="delete">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </PermissionGate>
            </div>
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Overview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><span className="text-muted-foreground">Email: </span>{lead.email ?? "—"}</div>
              <div><span className="text-muted-foreground">Phone: </span>{lead.phone_number ?? "—"}</div>
              <div><span className="text-muted-foreground">Source: </span>{lead.source}</div>
              <div><span className="text-muted-foreground">Sector: </span>{lead.sector ?? "—"}</div>
              <div><span className="text-muted-foreground">Assigned: </span>{lead.assigned_user?.name ?? "—"}</div>
              <div><span className="text-muted-foreground">Follow up: </span>{formatDate(lead.follow_up_date)}</div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Stage:</span>
                <Badge>{formatLabel(lead.stage)}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline">{formatLabel(lead.status)}</Badge>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {/* Update Stage */}
            <PermissionGate module="leads" action="update">
              <Card>
                <CardHeader><CardTitle>Update Stage</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Select
                    value={pendingStage}
                    onValueChange={(v: string | null) => v && setPendingStage(v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {stageChanged && (
                    <Textarea
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder="Add a note about this stage change (optional)"
                      rows={2}
                    />
                  )}
                  <Button
                    className="w-full"
                    disabled={!stageChanged || stageMutation.isPending}
                    onClick={() => stageMutation.mutate({ stage: pendingStage, note: stageNote || undefined })}
                  >
                    {stageMutation.isPending ? "Updating..." : "Update Stage"}
                  </Button>
                </CardContent>
              </Card>
            </PermissionGate>

            {/* Assign Lead */}
            <PermissionGate module="leads" action="update">
              <Card>
                <CardHeader><CardTitle>Assign Lead</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {lead.assigned_user && (
                    <p className="text-sm text-muted-foreground">
                      Currently:{" "}
                      <span className="font-medium text-foreground">{lead.assigned_user.name}</span>
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Select
                      value={assignRoleId}
                      onValueChange={(v: string | null) => {
                        setAssignRoleId(v ?? "");
                        setAssignUserId("");
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesData?.map((r) => (
                          <SelectItem key={r._id} value={r._id}>{formatLabel(r.name)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assignRoleId && (
                      <Select
                        value={assignUserId}
                        onValueChange={(v: string | null) => setAssignUserId(v ?? "")}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="User" />
                        </SelectTrigger>
                        <SelectContent>
                          {!assignRoleUsers?.length && (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No users</div>
                          )}
                          {assignRoleUsers?.map((u) => (
                            <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    disabled={!assignUserId || assignMutation.isPending}
                    onClick={() => assignMutation.mutate()}
                  >
                    {assignMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </CardContent>
              </Card>
            </PermissionGate>
          </div>
        </div>

        {/* Timeline & Notes */}
        <Card>
          <CardHeader><CardTitle>Timeline & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PermissionGate module="leads" action="update">
              <div className="flex gap-2">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note..."
                />
                <Button
                  onClick={() => noteMutation.mutate()}
                  disabled={!note.trim() || noteMutation.isPending}
                >
                  {noteMutation.isPending ? "Adding..." : "Add"}
                </Button>
              </div>
            </PermissionGate>
            <div className="space-y-3">
              {(lead.history ?? []).slice().reverse().map((entry, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">
                    {formatLabel(entry.type)}
                    {entry.stage ? ` · ${formatLabel(entry.stage)}` : ""}
                    {entry.action ? ` · ${formatLabel(entry.action)}` : ""}
                  </p>
                  {entry.note ? <p className="mt-1 text-muted-foreground">{entry.note}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(entry.created_at ?? entry.changed_at)}
                  </p>
                </div>
              ))}
              {!lead.history?.length && (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete lead?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{lead.lead_name}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ProtectedRoute>
  );
}
