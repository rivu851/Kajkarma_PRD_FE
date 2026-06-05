export type SystemRoleName =
  | "super_admin"
  | "admin"
  | "sales_manager"
  | "project_manager"
  | "hr"
  | "finance"
  | "sales_executive";

export type PermissionAction = "read" | "create" | "update" | "delete";

export type ModuleName =
  | "users"
  | "roles"
  | "leads"
  | "clients"
  | "communications"
  | "reminders"
  | "projects"
  | "employees"
  | "worklogs"
  | "revenue"
  | "payments"
  | "salary"
  | "reimbursements"
  | "reports"
  | "subscriptions"
  | "dashboard"
  | "forecasting";

export interface ModulePermissions {
  read: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
}

export interface Role {
  _id: string;
  name: string;
  description?: string;
  is_system?: boolean;
  hierarchy_level?: number;
  permissions?: Partial<Record<ModuleName, ModulePermissions>>;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRolePayload {
  name: string;
  description?: string;
  permissions?: Partial<Record<ModuleName, ModulePermissions>>;
}

export interface UpdateRolePermissionsPayload {
  permissions: Partial<Record<ModuleName, ModulePermissions>>;
}

export interface AccessControl {
  _id: string;
  user_id: string;
  module_permissions?: Partial<Record<ModuleName, ModulePermissions>>;
}
