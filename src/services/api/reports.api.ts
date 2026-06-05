import { apiClient } from "./axios";
import { normalizePaginated, normalizeReport } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { REPORT_TYPES } from "@/constants/enums";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export type ReportType = (typeof REPORT_TYPES)[number];

export interface Report {
  _id: string;
  client_id: string;
  client?: { _id: string; company_name: string };
  project_id?: string;
  project?: { _id: string; project_name: string };
  report_title: string;
  report_type: ReportType;
  month: string;
  file_url: string;
  uploaded_by?: string;
  uploader?: { _id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportQueryParams {
  page?: number;
  limit?: number;
  client_id?: string;
  project_id?: string;
  report_type?: ReportType;
  month?: string;
}

export const reportsApi = {
  getAll: async (params?: ReportQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Report>>>(
      "/reports",
      { params }
    );
    return normalizePaginated(data.data, normalizeReport) as PaginatedData<Report>;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Report>>(`/reports/${id}`);
    return normalizeReport(asRecord(data.data)) as Report;
  },
  create: async (payload: Omit<Report, "_id" | "createdAt" | "updatedAt" | "uploaded_by" | "client" | "project" | "uploader">) => {
    const { data } = await apiClient.post<ApiResponse<Report>>("/reports", payload);
    return normalizeReport(asRecord(data.data)) as Report;
  },
  update: async (id: string, payload: Partial<Report>) => {
    const { data } = await apiClient.patch<ApiResponse<Report>>(
      `/reports/${id}`,
      payload
    );
    return normalizeReport(asRecord(data.data)) as Report;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/reports/${id}`
    );
    return data.data;
  },
};
