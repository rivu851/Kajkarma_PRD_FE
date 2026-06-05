import { apiClient } from "./axios";
import type { ApiResponse } from "@/types/api.types";
import type { AuthUser, LoginPayload, LoginResponse, RefreshResponse } from "@/types/auth.types";
import { normalizeAuthUser, type RawAuthUser } from "@/utils/auth-user";

export const authApi = {
  login: async (payload: LoginPayload) => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      "/auth/login",
      payload
    );
    return data.data;
  },

  logout: async () => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/logout"
    );
    return data.data;
  },

  refresh: async (refreshToken: string) => {
    const { data } = await apiClient.post<ApiResponse<RefreshResponse>>(
      "/auth/refresh",
      { refreshToken }
    );
    return data.data;
  },

  me: async () => {
    const { data } = await apiClient.get<ApiResponse<RawAuthUser>>("/auth/me");
    return normalizeAuthUser(data.data);
  },
};
