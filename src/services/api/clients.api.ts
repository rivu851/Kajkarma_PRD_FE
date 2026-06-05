import { apiClient } from "./axios";
import { normalizeClient, normalizePaginated } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type {
  Client,
  ClientQueryParams,
  CreateClientPayload,
} from "@/types/client.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export const clientsApi = {
  getAll: async (params?: ClientQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Client>>>(
      "/clients",
      { params }
    );
    return normalizePaginated(data.data, normalizeClient);
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Client>>(`/clients/${id}`);
    return normalizeClient(asRecord(data.data));
  },
  create: async (payload: CreateClientPayload) => {
    const { data } = await apiClient.post<ApiResponse<Client>>("/clients", payload);
    return normalizeClient(asRecord(data.data));
  },
  update: async (id: string, payload: Partial<CreateClientPayload>) => {
    const { data } = await apiClient.patch<ApiResponse<Client>>(
      `/clients/${id}`,
      payload
    );
    return normalizeClient(asRecord(data.data));
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/clients/${id}`
    );
    return data.data;
  },
};
