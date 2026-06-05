import type {
  REMINDER_PRIORITIES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
} from "@/constants/enums";

export type ReminderType = (typeof REMINDER_TYPES)[number];
export type ReminderStatus = (typeof REMINDER_STATUSES)[number];
export type ReminderPriority = (typeof REMINDER_PRIORITIES)[number];

export interface Reminder {
  _id: string;
  title: string;
  description?: string;
  type: ReminderType;
  status: ReminderStatus;
  priority: ReminderPriority;
  reminder_date: string;
  reminder_time?: string;
  assigned_user_id: string;
  assigned_user?: { _id: string; name: string };
  related_module?: string;
  related_record_id?: string;
  is_read: boolean;
  snoozed_until?: string;
  completed_at?: string;
  completed_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReminderStats {
  totalCount?: number;
  pendingCount: number;
  overdueCount: number;
  dueTodayCount: number;
  completedCount: number;
  snoozedCount?: number;
  unreadCount: number;
  criticalCount: number;
}

export interface CreateReminderPayload {
  title: string;
  description?: string;
  priority?: ReminderPriority;
  reminder_date: string;
  reminder_time?: string;
  assigned_user_id: string;
}

export interface ReminderQueryParams {
  page?: number;
  limit?: number;
  status?: ReminderStatus | string;
  priority?: ReminderPriority;
  type?: ReminderType;
  is_read?: boolean;
  date_from?: string;
  date_to?: string;
  sort?: string;
  search?: string;
  assigned_user_id?: string;
}
