import type {
  PAYMENT_METHODS,
  UPCOMING_PAYMENT_STATUSES,
  UPCOMING_PAYMENT_TYPES,
} from "@/constants/enums";

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type UpcomingPaymentType = (typeof UPCOMING_PAYMENT_TYPES)[number];
export type UpcomingPaymentStatus = (typeof UPCOMING_PAYMENT_STATUSES)[number];

export interface Payment {
  _id: string;
  revenue_id: string;
  revenue?: { _id: string; title: string };
  client_id?: string;
  client?: { _id: string; company_name: string };
  project_id?: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpcomingPayment {
  _id: string;
  client_id: string;
  client?: { _id: string; company_name: string };
  project_id?: string;
  project?: { _id: string; project_name: string };
  revenue_id?: string;
  amount: number;
  due_date: string;
  payment_type: UpcomingPaymentType;
  payment_status: UpcomingPaymentStatus;
  reminder_date?: string;
  assigned_follow_up_user?: string;
  follow_up_user?: { _id: string; name: string };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  revenue_id?: string;
  client_id?: string;
  project_id?: string;
  payment_method?: PaymentMethod;
}

export interface UpcomingPaymentQueryParams {
  page?: number;
  limit?: number;
  client_id?: string;
  project_id?: string;
  payment_status?: UpcomingPaymentStatus;
  payment_type?: UpcomingPaymentType;
  assigned_follow_up_user?: string;
  due_within_days?: number;
}
