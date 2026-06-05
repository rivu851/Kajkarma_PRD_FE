import type { ModuleName, PermissionAction } from "@/types/role.types";

export const SENSITIVE_EMPLOYEE_ROLES = [
  "super_admin",
  "admin",
  "hr",
  "finance",
] as const;

export function hasModulePermission(
  permissions: Partial<Record<ModuleName, { read: boolean; create: boolean; update: boolean; delete: boolean }>> | undefined,
  module: ModuleName,
  action: PermissionAction,
  roleName?: string
): boolean {
  if (roleName === "super_admin") return true;
  if (!permissions) return false;
  const modulePerms = permissions[module];
  if (!modulePerms) return false;
  return Boolean(modulePerms[action]);
}
