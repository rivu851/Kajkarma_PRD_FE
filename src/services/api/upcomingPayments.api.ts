import { apiClient } from "./axios";
import { normalizePaginated, normalizeUpcomingPayment } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type {
  UpcomingPayment,
  UpcomingPaymentQueryParams,
} from "@/types/payment.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export interface CreateUpcomingPaymentPayload {
  client_id: string;
  project_id?: string;
  revenue_id?: string;
  amount: number;
  due_date: string;
  payment_type: UpcomingPayment["payment_type"];
  reminder_date?: string;
  assigned_follow_up_user?: string;
  notes?: string;
}

export const upcomingPaymentsApi = {
  getAll: async (params?: UpcomingPaymentQueryParams) => {
    const { data } = await apiClient.get<
      ApiResponse<PaginatedData<UpcomingPayment>>
    >("/upcoming-payments", { params });
    return normalizePaginated(data.data, normalizeUpcomingPayment) as PaginatedData<UpcomingPayment>;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<UpcomingPayment>>(
      `/upcoming-payments/${id}`
    );
    return normalizeUpcomingPayment(asRecord(data.data)) as UpcomingPayment;
  },
  create: async (payload: CreateUpcomingPaymentPayload) => {
    const { data } = await apiClient.post<ApiResponse<UpcomingPayment>>(
      "/upcoming-payments",
      payload
    );
    return normalizeUpcomingPayment(asRecord(data.data)) as UpcomingPayment;
  },
  update: async (id: string, payload: Partial<CreateUpcomingPaymentPayload>) => {
    const { data } = await apiClient.patch<ApiResponse<UpcomingPayment>>(
      `/upcoming-payments/${id}`,
      payload
    );
    return normalizeUpcomingPayment(asRecord(data.data)) as UpcomingPayment;
  },
  receive: async (id: string, notes?: string) => {
    const { data } = await apiClient.patch<ApiResponse<UpcomingPayment>>(
      `/upcoming-payments/${id}/receive`,
      { notes }
    );
    return normalizeUpcomingPayment(asRecord(data.data)) as UpcomingPayment;
  },
  cancel: async (id: string, notes?: string) => {
    const { data } = await apiClient.patch<ApiResponse<UpcomingPayment>>(
      `/upcoming-payments/${id}/cancel`,
      { notes }
    );
    return normalizeUpcomingPayment(asRecord(data.data)) as UpcomingPayment;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/upcoming-payments/${id}`
    );
    return data.data;
  },
};
