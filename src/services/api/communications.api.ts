import { apiClient } from "./axios";
import { normalizeCommunication, normalizePaginated } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { COMMUNICATION_TYPES, ENTITY_TYPES } from "@/constants/enums";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export type CommunicationType = (typeof COMMUNICATION_TYPES)[number];
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface Communication {
  _id: string;
  entity_type: EntityType;
  entity_id: string;
  user_id: string;
  user?: { _id: string; name: string };
  date: string;
  type: CommunicationType;
  notes?: string;
  outcome?: string;
  next_follow_up_date?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CommunicationQueryParams {
  page?: number;
  limit?: number;
  entity_type?: EntityType;
  entity_id?: string;
  type?: CommunicationType;
  user_id?: string;
}

export const communicationsApi = {
  getAll: async (params?: CommunicationQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Communication>>>(
      "/communications",
      { params }
    );
    return normalizePaginated(data.data, normalizeCommunication) as PaginatedData<Communication>;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Communication>>(
      `/communications/${id}`
    );
    return normalizeCommunication(asRecord(data.data)) as Communication;
  },
  create: async (payload: {
    entity_type: EntityType;
    entity_id: string;
    date?: string;
    type: CommunicationType;
    notes?: string;
    outcome?: string;
    next_follow_up_date?: string;
  }) => {
    const { data } = await apiClient.post<ApiResponse<Communication>>(
      "/communications",
      payload
    );
    return normalizeCommunication(asRecord(data.data)) as Communication;
  },
  update: async (id: string, payload: Partial<Communication>) => {
    const { data } = await apiClient.patch<ApiResponse<Communication>>(
      `/communications/${id}`,
      payload
    );
    return normalizeCommunication(asRecord(data.data)) as Communication;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/communications/${id}`
    );
    return data.data;
  },
};
