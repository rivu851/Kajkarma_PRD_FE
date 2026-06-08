export interface AttendanceSession {
  _id?: string;
  check_in: string;
  check_out?: string;
  duration_minutes?: number;
}

export interface Attendance {
  _id: string;
  employee_id: string;
  employee?: { _id: string; full_name: string };
  date: string;
  sessions: AttendanceSession[];
  total_minutes: number;
  is_checked_in: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
  employee_id?: string;
  date_from?: string;
  date_to?: string;
}
