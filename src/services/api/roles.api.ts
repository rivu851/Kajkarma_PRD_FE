import { apiClient } from "./axios";
import { normalizeList, normalizeRole } from "@/utils/api-normalize";

const asRecord = (value: unknown) => value as Record<string, unknown>;
import type { ApiResponse } from "@/types/api.types";
import type {
  CreateRolePayload,
  Role,
  UpdateRolePermissionsPayload,
} from "@/types/role.types";
import type { User } from "@/types/user.types";

export const rolesApi = {
  getAll: async () => {
    const { data } = await apiClient.get<ApiResponse<Role[]>>("/roles");
    return normalizeList(data.data, normalizeRole) as Role[];
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Role>>(`/roles/${id}`);
    return normalizeRole(asRecord(data.data)) as Role;
  },
  create: async (payload: CreateRolePayload) => {
    const { data } = await apiClient.post<ApiResponse<Role>>("/roles", payload);
    return normalizeRole(asRecord(data.data)) as Role;
  },
  update: async (id: string, payload: { name?: string; description?: string }) => {
    const { data } = await apiClient.patch<ApiResponse<Role>>(
      `/roles/${id}`,
      payload
    );
    return normalizeRole(asRecord(data.data)) as Role;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/roles/${id}`
    );
    return data.data;
  },
  updatePermissions: async (id: string, payload: UpdateRolePermissionsPayload) => {
    const { data } = await apiClient.patch<ApiResponse<Role>>(
      `/roles/${id}/permissions`,
      payload
    );
    return normalizeRole(asRecord(data.data)) as Role;
  },
  getUsers: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<User[]>>(
      `/roles/${id}/users`
    );
    return data.data;
  },
};
