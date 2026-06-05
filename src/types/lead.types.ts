import type { LEAD_STAGES, LEAD_STATUSES } from "@/constants/enums";

export type LeadStage = (typeof LEAD_STAGES)[number];
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadHistoryEntry {
  type: string;
  note?: string;
  stage?: LeadStage;
  user_id?: string;
  created_at?: string;
  action?: string;
  changed_at?: string;
}

export interface Lead {
  _id: string;
  lead_name: string;
  phone_number?: string;
  email?: string;
  company_name?: string;
  sector?: string;
  source: string;
  stage: LeadStage;
  status: LeadStatus;
  tags?: string[];
  notes?: string;
  follow_up_date?: string;
  assigned_user_id?: string;
  assigned_user?: { _id: string; name: string; email?: string };
  client_id?: string;
  history?: LeadHistoryEntry[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLeadPayload {
  lead_name: string;
  phone_number?: string;
  email?: string;
  company_name?: string;
  sector?: string;
  source: string;
  stage?: LeadStage;
  status?: LeadStatus;
  tags?: string[];
  notes?: string;
  follow_up_date?: string;
  assigned_user_id?: string;
}

export type UpdateLeadPayload = Partial<CreateLeadPayload> & {
  follow_up_date?: string | null;
};

export interface LeadQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  stage?: LeadStage;
  status?: LeadStatus;
  assigned_user_id?: string;
  source?: string;
}
