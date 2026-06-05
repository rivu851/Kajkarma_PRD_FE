import { apiClient } from "./axios";
import { normalizePaginated, normalizeRevenue } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { Revenue, RevenueQueryParams } from "@/types/revenue.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export interface CreateRevenuePayload {
  client_id: string;
  project_id?: string;
  title: string;
  amount: number;
  revenue_date: string;
  due_date?: string;
  type: Revenue["type"];
  notes?: string;
}

export const revenuesApi = {
  getAll: async (params?: RevenueQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Revenue>>>(
      "/revenues",
      { params }
    );
    return normalizePaginated(data.data, normalizeRevenue);
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Revenue>>(`/revenues/${id}`);
    return normalizeRevenue(asRecord(data.data));
  },
  create: async (payload: CreateRevenuePayload) => {
    const { data } = await apiClient.post<ApiResponse<Revenue>>("/revenues", payload);
    return normalizeRevenue(asRecord(data.data));
  },
  update: async (id: string, payload: Partial<CreateRevenuePayload & { status?: Revenue["status"] }>) => {
    const { data } = await apiClient.patch<ApiResponse<Revenue>>(
      `/revenues/${id}`,
      payload
    );
    return normalizeRevenue(asRecord(data.data));
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/revenues/${id}`
    );
    return data.data;
  },
};
