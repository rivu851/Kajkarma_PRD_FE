"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { leadsApi } from "@/services/api/leads.api";
import { getApiErrorMessage } from "@/services/api/axios";
import { LEAD_STAGES, LEAD_STATUSES } from "@/constants/enums";
import { formatLabel } from "@/utils/format";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  email: z.string().email().optional().or(z.literal("")),
  company_name: z.string().optional(),
  sector: z.string().optional(),
  stage: z.enum(LEAD_STAGES).optional(),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().optional(),
  follow_up_date: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadFormDialog({ open, onOpenChange }: LeadFormDialogProps) {
  const queryClient = useQueryClient();
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

  const mutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: () => {
      toast.success("Lead created");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(getApiErrorMessage(e)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Lead</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit((data) => mutation.mutate(data))}>
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
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input {...register("phone_number")} />
            </div>
            <div className="space-y-2">
              <Label>Follow Up Date</Label>
              <Input type="date" {...register("follow_up_date")} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Stage</Label>
              <Select value={watch("stage")} onValueChange={(v) => v && setValue("stage", v as FormValues["stage"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={watch("status")} onValueChange={(v) => v && setValue("status", v as FormValues["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea {...register("notes")} />
          </div>
          <Button type="submit" disabled={isSubmitting || mutation.isPending} className="w-full">
            {mutation.isPending ? "Creating..." : "Create Lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
