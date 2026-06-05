"use client";

import { useEffect } from "react";
import { useAuthInit } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth.store";
import { usePermissionStore } from "@/store/permission.store";
import {
  extractRolePermissions,
  hasEffectivePermissions,
  parseEffectivePermissions,
} from "@/utils/auth-user";

function bootstrapPermissionsFromUser() {
  const user = useAuthStore.getState().user;
  if (!user) return;

  const current = usePermissionStore.getState();
  const currentPermissions = parseEffectivePermissions(current.permissions);
  if (current.roleName && hasEffectivePermissions(currentPermissions)) return;

  const roleName = user.roleName ?? user.role?.name;
  const permissions = extractRolePermissions(user);

  if (roleName || hasEffectivePermissions(permissions)) {
    usePermissionStore.getState().setPermissions(permissions, roleName);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useAuthInit();

  useEffect(() => {
    bootstrapPermissionsFromUser();

    const unsubAuth = useAuthStore.persist.onFinishHydration(() => {
      bootstrapPermissionsFromUser();
    });
    const unsubPermissions = usePermissionStore.persist.onFinishHydration(() => {
      bootstrapPermissionsFromUser();
    });

    return () => {
      unsubAuth();
      unsubPermissions();
    };
  }, []);

  return <>{children}</>;
}
