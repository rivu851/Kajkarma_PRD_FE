import { apiClient } from "./axios";
import type { ApiResponse, PaginatedData, PaginationParams } from "@/types/api.types";
import type { EffectivePermissions } from "@/types/auth.types";
import { normalizePaginated, normalizeUser } from "@/utils/api-normalize";
import { parseEffectivePermissions, type PermissionsResponse } from "@/utils/auth-user";

const asRecord = (value: unknown) => value as Record<string, unknown>;
import type { AccessControl } from "@/types/role.types";
import type { CreateUserPayload, UpdateUserPayload, User } from "@/types/user.types";
import type { UserStatus } from "@/types/auth.types";

export const usersApi = {
  getAll: async (params?: PaginationParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<User>>>(
      "/users",
      { params }
    );
    return normalizePaginated(data.data, normalizeUser);
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return normalizeUser(asRecord(data.data));
  },
  create: async (payload: CreateUserPayload) => {
    const { data } = await apiClient.post<ApiResponse<User>>("/users", payload);
    return normalizeUser(asRecord(data.data));
  },
  update: async (id: string, payload: UpdateUserPayload) => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      `/users/${id}`,
      payload
    );
    return normalizeUser(asRecord(data.data));
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/users/${id}`
    );
    return data.data;
  },
  updateStatus: async (id: string, status: UserStatus) => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      `/users/${id}/status`,
      { status }
    );
    return normalizeUser(asRecord(data.data));
  },
  updateRole: async (id: string, role_id: string) => {
    const { data } = await apiClient.patch<ApiResponse<User>>(
      `/users/${id}/role`,
      { role_id }
    );
    return normalizeUser(asRecord(data.data));
  },
  getPermissions: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<PermissionsResponse>>(
      `/users/${id}/permissions`
    );
    return parseEffectivePermissions(data.data);
  },
  getAccessControl: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<AccessControl>>(
      `/users/${id}/access-control`
    );
    return data.data;
  },
  updateAccessControl: async (
    id: string,
    module_permissions: AccessControl["module_permissions"]
  ) => {
    const { data } = await apiClient.patch<ApiResponse<AccessControl>>(
      `/users/${id}/access-control`,
      { module_permissions }
    );
    return data.data;
  },
};
