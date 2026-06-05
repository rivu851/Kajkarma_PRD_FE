import type { SALARY_PAYMENT_MODES, SALARY_STATUSES } from "@/constants/enums";

export type SalaryStatus = (typeof SALARY_STATUSES)[number];
export type SalaryPaymentMode = (typeof SALARY_PAYMENT_MODES)[number];

export interface Salary {
  _id: string;
  employee_id: string;
  employee?: { _id: string; full_name: string };
  month: number;
  year: number;
  base_salary: number;
  bonus?: number;
  deductions?: number;
  net_salary: number;
  status: SalaryStatus;
  payment_mode?: SalaryPaymentMode;
  payment_date?: string;
  paid_by?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SalaryQueryParams {
  page?: number;
  limit?: number;
  employee_id?: string;
  month?: number;
  year?: number;
  status?: SalaryStatus;
}
