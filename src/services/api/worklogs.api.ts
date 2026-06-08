import { apiClient } from "./axios";
import { normalizePaginated, normalizeWorklog } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { WORK_STATUSES } from "@/constants/enums";

export interface GroupedWorklogProject {
  project_id: string;
  project_name: string;
  project_status: string;
  total_hours: number;
  entries_count: number;
  logs: Worklog[];
}

export interface GroupedWorklogsResponse {
  data: GroupedWorklogProject[];
  total_projects: number;
}

const asRecord = (value: unknown) => value as Record<string, unknown>;

export type WorkStatus = (typeof WORK_STATUSES)[number];

export interface Worklog {
  _id: string;
  employee_id: string;
  employee?: { _id: string; full_name: string };
  project_id: string;
  project?: { _id: string; project_name: string };
  date: string;
  task_title: string;
  task_description?: string;
  time_spent_hours: number;
  work_status: WorkStatus;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorklogQueryParams {
  page?: number;
  limit?: number;
  employee_id?: string;
  project_id?: string;
  work_status?: WorkStatus;
  date_from?: string;
  date_to?: string;
}

export interface CreateWorklogPayload {
  employee_id?: string;
  date: string;
  project_id: string;
  task_title: string;
  task_description?: string;
  time_spent_hours: number;
  work_status?: WorkStatus;
  remarks?: string;
}

export const worklogsApi = {
  getAll: async (params?: WorklogQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Worklog>>>(
      "/worklogs",
      { params }
    );
    return normalizePaginated(data.data, normalizeWorklog) as PaginatedData<Worklog>;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Worklog>>(`/worklogs/${id}`);
    return normalizeWorklog(asRecord(data.data)) as Worklog;
  },
  create: async (payload: CreateWorklogPayload) => {
    const { data } = await apiClient.post<ApiResponse<Worklog>>("/worklogs", payload);
    return normalizeWorklog(asRecord(data.data)) as Worklog;
  },
  update: async (id: string, payload: Partial<CreateWorklogPayload>) => {
    const { data } = await apiClient.patch<ApiResponse<Worklog>>(
      `/worklogs/${id}`,
      payload
    );
    return normalizeWorklog(asRecord(data.data)) as Worklog;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/worklogs/${id}`
    );
    return data.data;
  },

  getGrouped: async (params?: Omit<WorklogQueryParams, "page" | "limit">) => {
    const { data } = await apiClient.get<ApiResponse<GroupedWorklogsResponse>>(
      "/worklogs/grouped",
      { params }
    );
    const raw = data.data;
    return {
      total_projects: raw.total_projects,
      data: raw.data.map((group) => ({
        ...group,
        logs: group.logs.map((log) =>
          normalizeWorklog(log as unknown as Record<string, unknown>) as Worklog
        ),
      })),
    } as GroupedWorklogsResponse;
  },
};
