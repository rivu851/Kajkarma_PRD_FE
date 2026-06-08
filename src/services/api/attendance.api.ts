import { apiClient } from "./axios";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type { Attendance, AttendanceQueryParams } from "@/types/attendance.types";
import { normalizeAttendance } from "@/utils/api-normalize";
import { normalizePaginated } from "@/utils/api-normalize";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export const attendanceApi = {
  checkin: async () => {
    const { data } = await apiClient.post<ApiResponse<Attendance>>("/attendance/checkin");
    return normalizeAttendance(asRecord(data.data)) as Attendance;
  },

  checkout: async () => {
    const { data } = await apiClient.post<ApiResponse<Attendance>>("/attendance/checkout");
    return normalizeAttendance(asRecord(data.data)) as Attendance;
  },

  getToday: async () => {
    const { data } = await apiClient.get<ApiResponse<Attendance>>("/attendance/today");
    return normalizeAttendance(asRecord(data.data)) as Attendance;
  },

  getAll: async (params?: AttendanceQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Attendance>>>(
      "/attendance",
      { params }
    );
    return normalizePaginated(data.data, normalizeAttendance) as PaginatedData<Attendance>;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Attendance>>(`/attendance/${id}`);
    return normalizeAttendance(asRecord(data.data)) as Attendance;
  },
};
