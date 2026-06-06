"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leadsApi } from "@/services/api/leads.api";
import { rolesApi } from "@/services/api/roles.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { LEAD_STAGES, LEAD_STATUSES } from "@/constants/enums";
import { formatLabel } from "@/utils/format";
import type { Lead } from "@/types/lead.types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  lead_name: z.string().min(1, "Lead name is required"),
  source: z.string().min(1, "Source is required"),
  phone_number: z.string().optional(),
  email: z.string().optional().refine(
    (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: "Invalid email" }
  ),
  company_name: z.string().optional(),
  sector: z.string().optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().optional(),
  follow_up_date: z.string().optional(),
  // create-only fields
  stage: z.enum(LEAD_STAGES).optional(),
  assigned_user_id: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead;
}

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const isEdit = !!lead;
  const queryClient = useQueryClient();

  // assignment state — only used in create mode
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [assignedUserName, setAssignedUserName] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { stage: "new", status: "active" },
  });

  // use lead._id as dep so a React Query refetch (new object ref, same data)
  // doesn't wipe mid-edit changes
  useEffect(() => {
    if (open && lead) {
      reset({
        lead_name: lead.lead_name,
        source: lead.source,
        phone_number: lead.phone_number ?? "",
        email: lead.email ?? "",
        company_name: lead.company_name ?? "",
        sector: lead.sector ?? "",
        status: lead.status,
        notes: lead.notes ?? "",
        follow_up_date: lead.follow_up_date ? lead.follow_up_date.slice(0, 10) : "",
      });
    } else if (open && !lead) {
      reset({ stage: "new", status: "active" });
      setSelectedRoleId("");
      setAssignedUserName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?._id]);

  // roles + users for assignment (create mode only)
  const { data: rolesData } = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.getAll,
    enabled: !isEdit,
  });

  const { data: roleUsersData } = useQuery({
    queryKey: ["roles", selectedRoleId, "users"],
    queryFn: () => rolesApi.getUsers(selectedRoleId),
    enabled: !!selectedRoleId && !isEdit,
  });

  const handleRoleChange = (roleId: string | null) => {
    setSelectedRoleId(roleId ?? "");
    setValue("assigned_user_id", undefined);
    setAssignedUserName("");
  };

  const handleUserSelect = (userId: string | null) => {
    if (!userId) return;
    setValue("assigned_user_id", userId);
    const user = roleUsersData?.find((u) => u._id === userId);
    if (user) setAssignedUserName(user.name);
  };

  const handleClearAssign = () => {
    setValue("assigned_user_id", undefined);
    setAssignedUserName("");
    setSelectedRoleId("");
  };

  const createMutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      toast.success("Lead created");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  // PATCH /leads/:id only accepts these fields — no stage, no assigned_user_id
  const updateMutation = useMutation({
    mutationFn: ({ stage: _s, assigned_user_id: _a, ...rest }: FormValues) =>
      leadsApi.update(lead!._id, rest),
    onSuccess: () => {
      toast.success("Lead updated");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      queryClient.invalidateQueries({ queryKey: ["leads", lead!._id] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: FormValues) => {
    if (isEdit) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Lead" : "Create Lead"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label>Lead Name *</Label>
            <Input {...register("lead_name")} />
            {errors.lead_name && <p className="text-sm text-destructive">{errors.lead_name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Source *</Label>
            <Input {...register("source")} />
            {errors.source && <p className="text-sm text-destructive">{errors.source.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Company</Label>
              <Input {...register("company_name")} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone_number")} />
            </div>
            <div className="space-y-2">
              <Label>Sector</Label>
              <Input {...register("sector")} />
            </div>
            <div className="space-y-2">
              <Label>Follow Up Date</Label>
              <Input type="date" {...register("follow_up_date")} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(v: string | null) => v && setValue("status", v as FormValues["status"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stage + Assign To — create only (these have separate endpoints when editing) */}
          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  value={watch("stage")}
                  onValueChange={(v: string | null) => v && setValue("stage", v as FormValues["stage"])}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAD_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assign To</Label>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={selectedRoleId}
                    onValueChange={(v: string | null) => handleRoleChange(v)}
                  >
                    <SelectTrigger className="w-36">
                      <span className="text-sm text-muted-foreground">Select role</span>
                    </SelectTrigger>
                    <SelectContent>
                      {rolesData?.map((role) => (
                        <SelectItem key={role._id} value={role._id}>
                          {formatLabel(role.name)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedRoleId && (
                    <Select
                      value={watch("assigned_user_id") ?? ""}
                      onValueChange={(v: string | null) => handleUserSelect(v)}
                    >
                      <SelectTrigger className="w-36">
                        <span className="text-sm text-muted-foreground">Select user</span>
                      </SelectTrigger>
                      <SelectContent>
                        {roleUsersData?.length === 0 && (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No users in this role</div>
                        )}
                        {roleUsersData?.map((user) => (
                          <SelectItem key={user._id} value={user._id}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {assignedUserName && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {assignedUserName}
                      <button
                        type="button"
                        onClick={handleClearAssign}
                        className="ml-0.5 rounded-full hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} />
          </div>

          <Button type="submit" disabled={isSubmitting || isPending} className="w-full">
            {isPending
              ? isEdit ? "Saving..." : "Creating..."
              : isEdit ? "Save Changes" : "Create Lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
