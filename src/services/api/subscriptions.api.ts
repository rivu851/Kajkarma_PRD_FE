import { apiClient } from "./axios";
import { normalizeList, normalizePaginated, normalizeSubscription } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { BILLING_CYCLES, SUBSCRIPTION_STATUSES } from "@/constants/enums";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export interface Subscription {
  _id: string;
  plan_name: string;
  provider: string;
  start_date: string;
  end_date: string;
  renewal_date: string;
  amount: number;
  billing_cycle: BillingCycle;
  status: SubscriptionStatus;
  assigned_to?: string;
  notes?: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const subscriptionsApi = {
  getExpiringSoon: async () => {
    const { data } = await apiClient.get<ApiResponse<Subscription[]>>(
      "/subscriptions/expiring-soon"
    );
    return normalizeList(data.data, (item) =>
      normalizeSubscription<Subscription>(item)
    );
  },
  getAll: async (params?: PaginationParams & { status?: SubscriptionStatus; billing_cycle?: BillingCycle; provider?: string }) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Subscription>>>(
      "/subscriptions",
      { params }
    );
    return normalizePaginated(data.data, (item) =>
      normalizeSubscription<Subscription>(item)
    );
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Subscription>>(
      `/subscriptions/${id}`
    );
    return normalizeSubscription<Subscription>(asRecord(data.data));
  },
  create: async (payload: Omit<Subscription, "_id" | "status" | "createdAt" | "updatedAt" | "created_by">) => {
    const { data } = await apiClient.post<ApiResponse<Subscription>>(
      "/subscriptions",
      payload
    );
    return normalizeSubscription<Subscription>(asRecord(data.data));
  },
  update: async (id: string, payload: Partial<Subscription>) => {
    const { data } = await apiClient.patch<ApiResponse<Subscription>>(
      `/subscriptions/${id}`,
      payload
    );
    return normalizeSubscription<Subscription>(asRecord(data.data));
  },
  renew: async (id: string, payload: { end_date: string; renewal_date: string; amount?: number }) => {
    const { data } = await apiClient.patch<ApiResponse<Subscription>>(
      `/subscriptions/${id}/renew`,
      payload
    );
    return normalizeSubscription<Subscription>(asRecord(data.data));
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/subscriptions/${id}`
    );
    return data.data;
  },
};
