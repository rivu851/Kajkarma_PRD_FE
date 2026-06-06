import { apiClient } from "./axios";
import { normalizePaginated, normalizeProject } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type {
  CreateProjectPayload,
  UpdateProjectPayload,
  Project,
  ProjectQueryParams,
  ProjectStatus,
} from "@/types/project.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export const projectsApi = {
  getAll: async (params?: ProjectQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Project>>>(
      "/projects",
      { params }
    );
    return normalizePaginated(data.data, normalizeProject);
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Project>>(`/projects/${id}`);
    return normalizeProject(asRecord(data.data));
  },
  create: async (payload: CreateProjectPayload) => {
    const { data } = await apiClient.post<ApiResponse<Project>>("/projects", payload);
    return normalizeProject(asRecord(data.data));
  },
  update: async (id: string, payload: UpdateProjectPayload) => {
    const { data } = await apiClient.patch<ApiResponse<Project>>(
      `/projects/${id}`,
      payload
    );
    return normalizeProject(asRecord(data.data));
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/projects/${id}`
    );
    return data.data;
  },
  updateStatus: async (id: string, status: ProjectStatus) => {
    const { data } = await apiClient.patch<ApiResponse<Project>>(
      `/projects/${id}/status`,
      { status }
    );
    return normalizeProject(asRecord(data.data));
  },
  assign: async (id: string, assigned_employees: string[]) => {
    const { data } = await apiClient.patch<ApiResponse<Project>>(
      `/projects/${id}/assign`,
      { assigned_employees }
    );
    return normalizeProject(asRecord(data.data));
  },
};
