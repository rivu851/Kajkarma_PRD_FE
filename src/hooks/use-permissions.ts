"use client";

import { useAuthInit } from "@/hooks/use-auth";
import { hasModulePermission } from "@/constants/permissions";
import { usePermissionStore } from "@/store/permission.store";
import { useAuthStore } from "@/store/auth.store";
import {
  extractRolePermissions,
  hasEffectivePermissions,
  parseEffectivePermissions,
} from "@/utils/auth-user";
import { hasStoredTokens } from "@/services/api/axios";
import type { ModuleName, PermissionAction, SystemRoleName } from "@/types/role.types";

function useEffectiveAccess() {
  const storePermissions = usePermissionStore((s) => s.permissions);
  const storeRoleName = usePermissionStore((s) => s.roleName);
  const user = useAuthStore((s) => s.user);

  const roleName = (storeRoleName ?? user?.roleName ?? user?.role?.name) as
    | SystemRoleName
    | undefined;
  const parsedStorePermissions = parseEffectivePermissions(storePermissions);
  const userPermissions = user ? extractRolePermissions(user) : {};
  const permissions = hasEffectivePermissions(parsedStorePermissions)
    ? parsedStorePermissions
    : userPermissions;

  return { permissions, roleName };
}

export function usePermissions() {
  const { permissions, roleName } = useEffectiveAccess();

  const can = (module: ModuleName, action: PermissionAction) =>
    hasModulePermission(permissions, module, action, roleName);

  return {
    can,
    permissions,
    roleName,
    canRead: (module: ModuleName) => can(module, "read"),
    canCreate: (module: ModuleName) => can(module, "create"),
    canUpdate: (module: ModuleName) => can(module, "update"),
    canDelete: (module: ModuleName) => can(module, "delete"),
  };
}

export function useCan(module: ModuleName, action: PermissionAction): boolean {
  const { permissions, roleName } = useEffectiveAccess();
  return hasModulePermission(permissions, module, action, roleName);
}

/** True once we can safely evaluate module access (avoids false denials during session restore). */
export function usePermissionsReady() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { permissions, roleName } = useEffectiveAccess();
  const { isFetched, isFetching, isLoading, isError, fetchStatus, status } = useAuthInit();

  if (!isAuthenticated) return true;
  if (roleName === "super_admin") return true;
  if (hasEffectivePermissions(permissions)) return true;

  const tokenExists = hasStoredTokens();

  if (!tokenExists) return true;
  if (isFetching || isLoading) return false;
  if (isFetched || isError) return true;
  if (status === "pending" && fetchStatus === "idle") return false;

  return true;
}
