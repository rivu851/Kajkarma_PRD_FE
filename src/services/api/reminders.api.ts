import { apiClient } from "./axios";
import { normalizePaginated, normalizeReminder } from "@/utils/api-normalize";
import type { ApiResponse, PaginatedData } from "@/types/api.types";
import type {
  CreateReminderPayload,
  Reminder,
  ReminderQueryParams,
  ReminderStats,
} from "@/types/reminder.types";

const asRecord = (value: unknown) => value as Record<string, unknown>;

export const remindersApi = {
  getStats: async () => {
    const { data } = await apiClient.get<ApiResponse<ReminderStats>>(
      "/reminders/stats"
    );
    return data.data;
  },

  getMy: async (params?: ReminderQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Reminder>>>(
      "/reminders/my",
      { params }
    );
    return normalizePaginated(data.data, normalizeReminder);
  },

  getAll: async (params?: ReminderQueryParams) => {
    const { data } = await apiClient.get<ApiResponse<PaginatedData<Reminder>>>(
      "/reminders",
      { params }
    );
    return normalizePaginated(data.data, normalizeReminder);
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Reminder>>(
      `/reminders/${id}`
    );
    return normalizeReminder(asRecord(data.data));
  },

  create: async (payload: CreateReminderPayload) => {
    const { data } = await apiClient.post<ApiResponse<Reminder>>(
      "/reminders",
      payload
    );
    return normalizeReminder(asRecord(data.data));
  },

  markRead: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Reminder>>(
      `/reminders/${id}/read`
    );
    return normalizeReminder(asRecord(data.data));
  },

  markUnread: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Reminder>>(
      `/reminders/${id}/unread`
    );
    return normalizeReminder(asRecord(data.data));
  },

  markDone: async (id: string) => {
    const { data } = await apiClient.patch<ApiResponse<Reminder>>(
      `/reminders/${id}/done`
    );
    return normalizeReminder(asRecord(data.data));
  },

  snooze: async (id: string, snoozed_until: string) => {
    const { data } = await apiClient.patch<ApiResponse<Reminder>>(
      `/reminders/${id}/snooze`,
      { snoozed_until }
    );
    return normalizeReminder(asRecord(data.data));
  },

  reschedule: async (
    id: string,
    payload: { reminder_date: string; reminder_time?: string }
  ) => {
    const { data } = await apiClient.patch<ApiResponse<Reminder>>(
      `/reminders/${id}/reschedule`,
      payload
    );
    return normalizeReminder(asRecord(data.data));
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/reminders/${id}`
    );
    return data.data;
  },
};
