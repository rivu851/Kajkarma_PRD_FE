import { apiClient } from "./axios";
import { normalizeLead, normalizePaginated } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type {
  CreateLeadPayload,
  Lead,
  LeadQueryParams,
  LeadStage,
  UpdateLeadPayload,
} from "@/types/lead.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export const leadsApi = {
  getAll: async (params?: LeadQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Lead>>>(
      "/leads"
    );
    return normalizePaginated(data.data, normalizeLead);
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Lead>>(`/leads/${id}`);
    return normalizeLead(asRecord(data.data));
  },

  create: async (payload: CreateLeadPayload) => {
    const { data } = await apiClient.post<ApiResponse<Lead>>("/leads", payload);
    return normalizeLead(asRecord(data.data));
  },

  update: async (id: string, payload: UpdateLeadPayload) => {
    const { data } = await apiClient.patch<ApiResponse<Lead>>(
      `/leads/${id}`,
      payload
    );
    return normalizeLead(asRecord(data.data));
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/leads/${id}`
    );
    return data.data;
  },

  updateStage: async (id: string, stage: LeadStage, note?: string) => {
    const { data } = await apiClient.patch<ApiResponse<Lead>>(
      `/leads/${id}/stage`,
      { stage, note }
    );
    return normalizeLead(asRecord(data.data));
  },

  assign: async (id: string, assigned_user_id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Lead>>(
      `/leads/${id}/assign`,
      { assigned_user_id }
    );
    return normalizeLead(asRecord(data.data));
  },

  convert: async (id: string) => {
    const { data } = await apiClient.post<
      ApiResponse<{ lead: Lead; client: unknown }>
    >(`/leads/${id}/convert`);
    return data.data;
  },

  addNote: async (id: string, note: string) => {
    const { data } = await apiClient.post<ApiResponse<Lead>>(
      `/leads/${id}/notes`,
      { note }
    );
    return normalizeLead(asRecord(data.data));
  },
};
