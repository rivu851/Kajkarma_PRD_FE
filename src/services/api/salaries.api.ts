import { apiClient } from "./axios";
import { normalizePaginated, normalizeSalary } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { Salary, SalaryQueryParams } from "@/types/salary.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export interface CreateSalaryPayload {
  employee_id: string;
  month: number;
  year: number;
  base_salary: number;
  bonus?: number;
  deductions?: number;
  notes?: string;
}

export const salariesApi = {
  getAll: async (params?: SalaryQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Salary>>>(
      "/salaries",
      { params }
    );
    return normalizePaginated(data.data, normalizeSalary) as PaginatedData<Salary>;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Salary>>(`/salaries/${id}`);
    return normalizeSalary(asRecord(data.data)) as Salary;
  },
  create: async (payload: CreateSalaryPayload) => {
    const { data } = await apiClient.post<ApiResponse<Salary>>("/salaries", payload);
    return normalizeSalary(asRecord(data.data)) as Salary;
  },
  update: async (id: string, payload: Partial<CreateSalaryPayload>) => {
    const { data } = await apiClient.patch<ApiResponse<Salary>>(
      `/salaries/${id}`,
      payload
    );
    return normalizeSalary(asRecord(data.data)) as Salary;
  },
  pay: async (
    id: string,
    payload: { payment_mode: Salary["payment_mode"]; payment_date: string; notes?: string }
  ) => {
    const { data } = await apiClient.patch<ApiResponse<Salary>>(
      `/salaries/${id}/pay`,
      payload
    );
    return normalizeSalary(asRecord(data.data)) as Salary;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/salaries/${id}`
    );
    return data.data;
  },
};
