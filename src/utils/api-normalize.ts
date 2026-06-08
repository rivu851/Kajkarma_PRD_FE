import type { PaginatedData } from "@/types/api.types";
import type { Client } from "@/types/client.types";
import type { Lead, LeadHistoryEntry } from "@/types/lead.types";
import type { Project } from "@/types/project.types";
import type { User } from "@/types/user.types";
import type { Revenue } from "@/types/revenue.types";
import type { Payment, UpcomingPayment } from "@/types/payment.types";
import type { Reminder } from "@/types/reminder.types";
import type { DashboardOverview } from "@/types/dashboard.types";
import type { Role } from "@/types/role.types";
import { normalizeAuthUser, type RawAuthUser } from "@/utils/auth-user";

type PopulatedRef<T extends { _id: string }> = string | T | null | undefined;

function asPopulated<T extends { _id: string }>(ref: PopulatedRef<T>): T | undefined {
  if (!ref || typeof ref === "string") return undefined;
  return ref;
}

function refId(ref: PopulatedRef<{ _id: string }> | undefined): string | undefined {
  if (!ref) return undefined;
  if (typeof ref === "string") return ref;
  return ref._id;
}

function timestamps(raw: {
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}) {
  return {
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

function normalizeLeadHistoryEntry(raw: Record<string, unknown>): LeadHistoryEntry {
  return {
    type: String(raw.action ?? raw.type ?? ""),
    note: raw.note as string | undefined,
    stage: raw.stage as LeadHistoryEntry["stage"],
    user_id: String(raw.changed_by ?? raw.user_id ?? ""),
    created_at: String(raw.changed_at ?? raw.created_at ?? ""),
  };
}

export function normalizeLead(raw: Record<string, unknown>): Lead {
  const assigned = asPopulated<{ _id: string; name: string; email?: string }>(
    raw.assigned_user_id as PopulatedRef<{ _id: string; name: string; email?: string }>
  );

  return {
    ...(raw as unknown as Lead),
    assigned_user_id: refId(
      raw.assigned_user_id as PopulatedRef<{ _id: string }>
    ),
    assigned_user: assigned,
    client_id: refId(raw.client_id as PopulatedRef<{ _id: string }>),
    history: Array.isArray(raw.history)
      ? raw.history.map((entry) =>
          normalizeLeadHistoryEntry(entry as Record<string, unknown>)
        )
      : [],
    ...timestamps(raw),
  };
}

export function normalizeClient(raw: Record<string, unknown>): Client {
  const manager = asPopulated<{ _id: string; name: string }>(
    raw.assigned_manager_id as PopulatedRef<{ _id: string; name: string }>
  );

  return {
    ...(raw as unknown as Client),
    assigned_manager_id: refId(
      raw.assigned_manager_id as PopulatedRef<{ _id: string }>
    ),
    assigned_manager: manager,
    source_lead_id: refId(raw.source_lead_id as PopulatedRef<{ _id: string }>),
    ...timestamps(raw),
  };
}

export function normalizeProject(raw: Record<string, unknown>): Project {
  const client = asPopulated<{ _id: string; company_name: string }>(
    raw.client_id as PopulatedRef<{ _id: string; company_name: string }>
  );
  const assignedEmployees = Array.isArray(raw.assigned_employees)
    ? raw.assigned_employees
    : [];

  const employees = assignedEmployees
    .filter((item): item is { _id: string; full_name: string } => typeof item === "object" && item !== null)
    .map((item) => ({ _id: item._id, full_name: item.full_name }));

  return {
    ...(raw as unknown as Project),
    client_id: refId(raw.client_id as PopulatedRef<{ _id: string }>) ?? "",
    client: client ? { _id: client._id, company_name: client.company_name } : undefined,
    assigned_employees: assignedEmployees.map((item) =>
      typeof item === "string" ? item : item._id
    ),
    employees,
    created_by: refId(raw.created_by as PopulatedRef<{ _id: string }>),
    ...timestamps(raw),
  };
}

export function normalizeUser(raw: Record<string, unknown>): User {
  const roleRef = asPopulated<{ _id: string; name: string }>(
    raw.role_id as PopulatedRef<{ _id: string; name: string }>
  );

  return {
    ...(raw as unknown as User),
    role_id: refId(raw.role_id as PopulatedRef<{ _id: string }>) ?? "",
    role: roleRef ? { _id: roleRef._id, name: roleRef.name } : undefined,
    ...timestamps(raw),
  };
}

export function normalizeRevenue(raw: Record<string, unknown>): Revenue {
  const client = asPopulated<{ _id: string; company_name: string }>(
    raw.client_id as PopulatedRef<{ _id: string; company_name: string }>
  );
  const project = asPopulated<{ _id: string; project_name: string }>(
    raw.project_id as PopulatedRef<{ _id: string; project_name: string }>
  );

  return {
    ...(raw as unknown as Revenue),
    client_id: refId(raw.client_id as PopulatedRef<{ _id: string }>) ?? "",
    client: client ? { _id: client._id, company_name: client.company_name } : undefined,
    project_id: refId(raw.project_id as PopulatedRef<{ _id: string }>),
    project: project ? { _id: project._id, project_name: project.project_name } : undefined,
    created_by: refId(raw.created_by as PopulatedRef<{ _id: string }>),
    ...timestamps(raw),
  };
}

export function normalizePayment(raw: Record<string, unknown>): Payment {
  const revenue = asPopulated<{ _id: string; title: string }>(
    raw.revenue_id as PopulatedRef<{ _id: string; title: string }>
  );
  const client = asPopulated<{ _id: string; company_name: string }>(
    raw.client_id as PopulatedRef<{ _id: string; company_name: string }>
  );

  return {
    ...(raw as unknown as Payment),
    revenue_id: refId(raw.revenue_id as PopulatedRef<{ _id: string }>) ?? "",
    revenue: revenue ? { _id: revenue._id, title: revenue.title } : undefined,
    client_id: refId(raw.client_id as PopulatedRef<{ _id: string }>),
    client: client ? { _id: client._id, company_name: client.company_name } : undefined,
    project_id: refId(raw.project_id as PopulatedRef<{ _id: string }>),
    created_by: refId(raw.created_by as PopulatedRef<{ _id: string }>),
    ...timestamps(raw),
  };
}

export function normalizeUpcomingPayment(raw: Record<string, unknown>) {
  const client = asPopulated<{ _id: string; company_name: string }>(
    raw.client_id as PopulatedRef<{ _id: string; company_name: string }>
  );
  const project = asPopulated<{ _id: string; project_name: string }>(
    raw.project_id as PopulatedRef<{ _id: string; project_name: string }>
  );
  const followUp = asPopulated<{ _id: string; name: string }>(
    raw.assigned_follow_up_user as PopulatedRef<{ _id: string; name: string }>
  );

  return {
    ...(raw as object),
    client_id: refId(raw.client_id as PopulatedRef<{ _id: string }>) ?? "",
    client: client ? { _id: client._id, company_name: client.company_name } : undefined,
    project_id: refId(raw.project_id as PopulatedRef<{ _id: string }>),
    project: project ? { _id: project._id, project_name: project.project_name } : undefined,
    revenue_id: refId(raw.revenue_id as PopulatedRef<{ _id: string }>),
    assigned_follow_up_user: refId(
      raw.assigned_follow_up_user as PopulatedRef<{ _id: string }>
    ),
    follow_up_user: followUp
      ? { _id: followUp._id, name: followUp.name }
      : undefined,
    ...timestamps(raw),
  };
}

export function normalizeReminder(raw: Record<string, unknown>): Reminder {
  const assigned = asPopulated<{ _id: string; name: string }>(
    raw.assigned_user_id as PopulatedRef<{ _id: string; name: string }>
  );

  return {
    ...(raw as unknown as Reminder),
    assigned_user_id: refId(
      raw.assigned_user_id as PopulatedRef<{ _id: string }>
    ) ?? "",
    assigned_user: assigned,
    ...timestamps(raw),
  };
}

export function normalizeCommunication(raw: Record<string, unknown>) {
  const user = asPopulated<{ _id: string; name: string }>(
    raw.user_id as PopulatedRef<{ _id: string; name: string }>
  );

  return {
    ...(raw as object),
    user_id: refId(raw.user_id as PopulatedRef<{ _id: string }>) ?? "",
    user,
    ...timestamps(raw),
  };
}

export function normalizeWorklog(raw: Record<string, unknown>) {
  const employee =
    (raw.employee as { _id: string; full_name: string } | null | undefined) ??
    asPopulated<{ _id: string; full_name: string }>(
      raw.employee_id as PopulatedRef<{ _id: string; full_name: string }>
    );
  const project = asPopulated<{ _id: string; project_name: string }>(
    raw.project_id as PopulatedRef<{ _id: string; project_name: string }>
  );

  return {
    ...(raw as object),
    employee_id: refId(raw.employee_id as PopulatedRef<{ _id: string }>) ?? "",
    employee: employee ? { _id: employee._id, full_name: employee.full_name } : undefined,
    project_id: refId(raw.project_id as PopulatedRef<{ _id: string }>) ?? "",
    project: project ? { _id: project._id, project_name: project.project_name } : undefined,
    ...timestamps(raw),
  };
}

export function normalizeEmployee(raw: Record<string, unknown>) {
  const user = asPopulated<{ _id: string; name: string; email?: string }>(
    raw.user_id as PopulatedRef<{ _id: string; name: string; email?: string }>
  );

  return {
    ...(raw as object),
    user_id: refId(raw.user_id as PopulatedRef<{ _id: string }>),
    user,
    ...timestamps(raw),
  };
}

export function normalizeSalary(raw: Record<string, unknown>) {
  const employee = asPopulated<{ _id: string; full_name: string }>(
    raw.employee_id as PopulatedRef<{ _id: string; full_name: string }>
  );

  return {
    ...(raw as object),
    employee_id: refId(raw.employee_id as PopulatedRef<{ _id: string }>) ?? "",
    employee: employee ? { _id: employee._id, full_name: employee.full_name } : undefined,
    paid_by: refId(raw.paid_by as PopulatedRef<{ _id: string }>),
    ...timestamps(raw),
  };
}

export function normalizeReimbursement(raw: Record<string, unknown>) {
  const employee = asPopulated<{ _id: string; full_name: string }>(
    raw.employee_id as PopulatedRef<{ _id: string; full_name: string }>
  );

  return {
    ...(raw as object),
    employee_id: refId(raw.employee_id as PopulatedRef<{ _id: string }>) ?? "",
    employee: employee ? { _id: employee._id, full_name: employee.full_name } : undefined,
    ...timestamps(raw),
  };
}

export function normalizeSubscription<T = Record<string, unknown>>(
  raw: Record<string, unknown>
): T {
  return {
    ...(raw as object),
    ...timestamps(raw),
  } as T;
}

export function normalizeReport(raw: Record<string, unknown>) {
  const base = raw as unknown as {
    _id: string;
    report_title: string;
    report_type: string;
    month: string;
    file_url: string;
  };
  const client = asPopulated<{ _id: string; company_name: string }>(
    raw.client_id as PopulatedRef<{ _id: string; company_name: string }>
  );
  const project = asPopulated<{ _id: string; project_name: string }>(
    raw.project_id as PopulatedRef<{ _id: string; project_name: string }>
  );
  const uploader = asPopulated<{ _id: string; name: string }>(
    raw.uploaded_by as PopulatedRef<{ _id: string; name: string }>
  );

  return {
    ...base,
    client_id: refId(raw.client_id as PopulatedRef<{ _id: string }>) ?? "",
    client: client ? { _id: client._id, company_name: client.company_name } : undefined,
    project_id: refId(raw.project_id as PopulatedRef<{ _id: string }>),
    project: project ? { _id: project._id, project_name: project.project_name } : undefined,
    uploaded_by: refId(raw.uploaded_by as PopulatedRef<{ _id: string }>),
    uploader: uploader ? { _id: uploader._id, name: uploader.name } : undefined,
    ...timestamps(raw),
  };
}

export function normalizeAttendance(raw: Record<string, unknown>) {
  const employee = asPopulated<{ _id: string; full_name: string }>(
    raw.employee_id as PopulatedRef<{ _id: string; full_name: string }>
  );

  return {
    ...(raw as object),
    employee_id: refId(raw.employee_id as PopulatedRef<{ _id: string }>) ?? "",
    employee: employee ? { _id: employee._id, full_name: employee.full_name } : undefined,
    sessions: Array.isArray(raw.sessions) ? raw.sessions : [],
    total_minutes: typeof raw.total_minutes === "number" ? raw.total_minutes : 0,
    is_checked_in: raw.is_checked_in === true,
    ...timestamps(raw),
  };
}

export function normalizeRole(raw: Record<string, unknown>): Role {
  return {
    ...(raw as unknown as Role),
    ...timestamps(raw),
  };
}

export function normalizeDashboardOverview(raw: DashboardOverview): DashboardOverview {
  return raw;
}

export function normalizePaginated<T, R>(
  result: PaginatedData<T>,
  normalizer: (item: Record<string, unknown>) => R
): PaginatedData<R> {
  return {
    ...result,
    data: result.data.map((item) =>
      normalizer(item as unknown as Record<string, unknown>)
    ),
  };
}

export function normalizeList<T>(
  items: T[],
  normalizer: (item: Record<string, unknown>) => T
): T[] {
  return items.map((item) => normalizer(item as unknown as Record<string, unknown>));
}

export { normalizeAuthUser, type RawAuthUser };
