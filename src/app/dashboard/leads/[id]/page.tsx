"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leadsApi } from "@/services/api/leads.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { PageHeader } from "@/components/layout/page-header";
import { ProtectedRoute } from "@/components/permissions/protected-route";
import { PermissionGate } from "@/components/permissions/permission-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatLabel } from "@/utils/format";
import { LEAD_STAGES } from "@/constants/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");

  const { data: lead, isLoading } = useQuery({
    queryKey: ["leads", id],
    queryFn: () => leadsApi.getById(id),
    enabled: !!id,
  });

  const stageMutation = useMutation({
    mutationFn: (stage: string) => leadsApi.updateStage(id, stage as never),
    onSuccess: () => {
      toast.success("Stage updated");
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

  const convertMutation = useMutation({
    mutationFn: () => leadsApi.convert(id),
    onSuccess: () => {
      toast.success("Lead converted to client");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (!lead) return <p>Lead not found</p>;

  return (
    <ProtectedRoute module="leads">
      <div className="space-y-6">
        <PageHeader
          title={lead.lead_name}
          description={lead.company_name}
          actions={
            lead.stage === "won" ? (
              <PermissionGate module="leads" action="update">
                <Button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>
                  Convert to Client
                </Button>
              </PermissionGate>
            ) : null
          }
        />

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><span className="text-muted-foreground">Email:</span> {lead.email ?? "—"}</div>
              <div><span className="text-muted-foreground">Phone:</span> {lead.phone_number ?? "—"}</div>
              <div><span className="text-muted-foreground">Source:</span> {lead.source}</div>
              <div><span className="text-muted-foreground">Sector:</span> {lead.sector ?? "—"}</div>
              <div><span className="text-muted-foreground">Assigned:</span> {lead.assigned_user?.name ?? "—"}</div>
              <div><span className="text-muted-foreground">Follow up:</span> {formatDate(lead.follow_up_date)}</div>
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

          <Card>
            <CardHeader><CardTitle>Update Stage</CardTitle></CardHeader>
            <CardContent>
              <PermissionGate module="leads" action="update">
                <Select value={lead.stage} onValueChange={(v) => v && stageMutation.mutate(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PermissionGate>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader><CardTitle>Timeline & Notes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <PermissionGate module="leads" action="update">
              <div className="flex gap-2">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note..." />
                <Button onClick={() => noteMutation.mutate()} disabled={!note.trim() || noteMutation.isPending}>
                  Add
                </Button>
              </div>
            </PermissionGate>
            <div className="space-y-3">
              {(lead.history ?? []).slice().reverse().map((entry, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <p className="font-medium">{entry.type}{entry.stage ? ` · ${formatLabel(entry.stage)}` : ""}</p>
                  {entry.note ? <p className="text-muted-foreground">{entry.note}</p> : null}
                  <p className="text-xs text-muted-foreground">{formatDate(entry.created_at)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
