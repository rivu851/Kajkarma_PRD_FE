import type {
  PAYMENT_STATUSES,
  PROJECT_CATEGORIES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
} from "@/constants/enums";

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];
export type ProjectPaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Project {
  _id: string;
  project_name: string;
  client_id: string;
  client?: { _id: string; company_name: string };
  category: ProjectCategory;
  start_date?: string;
  end_date?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  assigned_employees?: string[];
  employees?: Array<{ _id: string; full_name: string }>;
  payment_status: ProjectPaymentStatus;
  notes?: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProjectPayload {
  project_name: string;
  client_id: string;
  category: ProjectCategory;
  start_date?: string;
  end_date?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  assigned_employees?: string[];
  payment_status?: ProjectPaymentStatus;
  notes?: string;
}

export interface ProjectQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
  client_id?: string;
  category?: ProjectCategory;
  priority?: ProjectPriority;
}
