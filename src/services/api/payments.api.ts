import { apiClient } from "./axios";
import { normalizePaginated, normalizePayment } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { Payment, PaymentQueryParams } from "@/types/payment.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export interface CreatePaymentPayload {
  revenue_id: string;
  amount: number;
  payment_date: string;
  payment_method: Payment["payment_method"];
  reference_number?: string;
  notes?: string;
}

export const paymentsApi = {
  getAll: async (params?: PaymentQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Payment>>>(
      "/payments",
      { params }
    );
    return normalizePaginated(data.data, normalizePayment);
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
    return normalizePayment(asRecord(data.data));
  },
  create: async (payload: CreatePaymentPayload) => {
    const { data } = await apiClient.post<ApiResponse<Payment>>("/payments", payload);
    return normalizePayment(asRecord(data.data));
  },
  update: async (id: string, payload: Partial<CreatePaymentPayload>) => {
    const { data } = await apiClient.patch<ApiResponse<Payment>>(
      `/payments/${id}`,
      payload
    );
    return normalizePayment(asRecord(data.data));
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/payments/${id}`
    );
    return data.data;
  },
};
