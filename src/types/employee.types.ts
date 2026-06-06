import type { EMPLOYEE_STATUSES } from "@/constants/enums";

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export interface Employee {
  _id: string;
  user_id?: string;
  full_name: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  department: string;
  role_designation: string;
  joining_date: string;
  salary?: number;
  pending_salary?: number;
  status: EmployeeStatus;
  bank_account_holder?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  upi_id?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserAccountPayload {
  email: string;
  password: string;
  role_id: string;
}

export interface CreateEmployeePayload {
  user_id?: string;
  full_name: string;
  date_of_birth?: string;
  phone_number?: string;
  email?: string;
  department: string;
  role_designation: string;
  joining_date: string;
  salary?: number;
  pending_salary?: number;
  status?: EmployeeStatus;
  bank_account_holder?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  branch_name?: string;
  upi_id?: string;
  create_user_account?: CreateUserAccountPayload;
}

export interface EmployeeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: EmployeeStatus;
  department?: string;
}
