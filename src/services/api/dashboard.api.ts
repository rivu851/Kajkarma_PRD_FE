import { apiClient } from "./axios";
import type { ApiResponse } from "@/types/api.types";
import type { DashboardOverview } from "@/types/dashboard.types";

export const dashboardApi = {
  getOverview: async () => {
    const { data } = await apiClient.get<ApiResponse<DashboardOverview>>(
      "/dashboard/overview"
    );
    return data.data;
  },
};
