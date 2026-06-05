import { apiClient } from "./axios";
import { normalizePaginated, normalizeReimbursement } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { REIMBURSEMENT_CATEGORIES, REIMBURSEMENT_STATUSES } from "@/constants/enums";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export type ReimbursementStatus = (typeof REIMBURSEMENT_STATUSES)[number];
export type ReimbursementCategory = (typeof REIMBURSEMENT_CATEGORIES)[number];

export interface Reimbursement {
  _id: string;
  employee_id: string;
  employee?: { _id: string; full_name: string };
  expense_title: string;
  amount: number;
  expense_date: string;
  reason: string;
  category: ReimbursementCategory;
  status: ReimbursementStatus;
  project_id?: string;
  client_id?: string;
  bill_attachment_url?: string;
  notes?: string;
  approved_by?: string;
  approval_date?: string;
  paid_date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReimbursementQueryParams {
  page?: number;
  limit?: number;
  employee_id?: string;
  status?: ReimbursementStatus;
  category?: ReimbursementCategory;
  project_id?: string;
  client_id?: string;
}

export const reimbursementsApi = {
  getAll: async (params?: ReimbursementQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Reimbursement>>>(
      "/reimbursements",
      { params }
    );
    return normalizePaginated(data.data, normalizeReimbursement) as PaginatedData<Reimbursement>;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Reimbursement>>(
      `/reimbursements/${id}`
    );
    return normalizeReimbursement(asRecord(data.data)) as Reimbursement;
  },
  create: async (payload: Omit<Reimbursement, "_id" | "status" | "createdAt" | "updatedAt" | "employee">) => {
    const { data } = await apiClient.post<ApiResponse<Reimbursement>>(
      "/reimbursements",
      payload
    );
    return normalizeReimbursement(asRecord(data.data)) as Reimbursement;
  },
  update: async (id: string, payload: Partial<Reimbursement>) => {
    const { data } = await apiClient.patch<ApiResponse<Reimbursement>>(
      `/reimbursements/${id}`,
      payload
    );
    return normalizeReimbursement(asRecord(data.data)) as Reimbursement;
  },
  approve: async (id: string, notes?: string) => {
    const { data } = await apiClient.patch<ApiResponse<Reimbursement>>(
      `/reimbursements/${id}/approve`,
      { notes }
    );
    return normalizeReimbursement(asRecord(data.data)) as Reimbursement;
  },
  reject: async (id: string, notes?: string) => {
    const { data } = await apiClient.patch<ApiResponse<Reimbursement>>(
      `/reimbursements/${id}/reject`,
      { notes }
    );
    return normalizeReimbursement(asRecord(data.data)) as Reimbursement;
  },
  pay: async (id: string, paid_date: string, notes?: string) => {
    const { data } = await apiClient.patch<ApiResponse<Reimbursement>>(
      `/reimbursements/${id}/pay`,
      { paid_date, notes }
    );
    return normalizeReimbursement(asRecord(data.data)) as Reimbursement;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/reimbursements/${id}`
    );
    return data.data;
  },
};
