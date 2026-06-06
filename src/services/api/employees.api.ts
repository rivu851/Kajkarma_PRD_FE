import { apiClient } from "./axios";
import { normalizeEmployee, normalizePaginated } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type {
  CreateEmployeePayload,
  Employee,
  EmployeeQueryParams,
} from "@/types/employee.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export const employeesApi = {
  getAll: async (params?: EmployeeQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Employee>>>(
      "/employees",
    );
    return normalizePaginated(data.data, normalizeEmployee) as unknown as PaginatedData<Employee>;
  },
  getMe: async () => {
    const { data } = await apiClient.get<ApiResponse<Employee>>("/employees/me");
    return normalizeEmployee(asRecord(data.data)) as unknown as Employee;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Employee>>(`/employees/${id}`);
    return normalizeEmployee(asRecord(data.data)) as unknown as Employee;
  },
  create: async (payload: CreateEmployeePayload) => {
    const { data } = await apiClient.post<ApiResponse<Employee>>(
      "/employees",
      payload
    );
    return normalizeEmployee(asRecord(data.data)) as unknown as Employee;
  },
  update: async (id: string, payload: Partial<CreateEmployeePayload>) => {
    const { data } = await apiClient.patch<ApiResponse<Employee>>(
      `/employees/${id}`,
      payload
    );
    return normalizeEmployee(asRecord(data.data)) as unknown as Employee;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/employees/${id}`
    );
    return data.data;
  },
};
