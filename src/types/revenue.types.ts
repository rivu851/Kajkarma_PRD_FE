import type { REVENUE_STATUSES, REVENUE_TYPES } from "@/constants/enums";

export type RevenueType = (typeof REVENUE_TYPES)[number];
export type RevenueStatus = (typeof REVENUE_STATUSES)[number];

export interface Revenue {
  _id: string;
  client_id: string;
  client?: { _id: string; company_name: string };
  project_id?: string;
  project?: { _id: string; project_name: string };
  title: string;
  amount: number;
  revenue_date: string;
  due_date?: string;
  type: RevenueType;
  status: RevenueStatus;
  notes?: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RevenueQueryParams {
  page?: number;
  limit?: number;
  client_id?: string;
  project_id?: string;
  status?: RevenueStatus;
  type?: RevenueType;
}
