"use client";

import { SENSITIVE_EMPLOYEE_ROLES } from "@/constants/permissions";
import { usePermissions } from "@/hooks/use-permissions";

export function useCanViewSensitiveEmployeeData(): boolean {
  const { roleName } = usePermissions();
  if (!roleName) return false;
  return (SENSITIVE_EMPLOYEE_ROLES as readonly string[]).includes(roleName);
}
