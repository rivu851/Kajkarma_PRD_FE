"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/services/api/auth.api";
import { rolesApi } from "@/services/api/roles.api";
import { usersApi } from "@/services/api/users.api";
import {
  clearStoredTokens,
  getApiErrorMessage,
  setStoredTokens,
} from "@/services/api/axios";
import { useAuthStore } from "@/store/auth.store";
import { usePermissionStore } from "@/store/permission.store";
import type { AuthUser, EffectivePermissions, LoginPayload } from "@/types/auth.types";
import {
  extractRolePermissions,
  hasEffectivePermissions,
  normalizeAuthUser,
  parseEffectivePermissions,
  type RawAuthUser,
} from "@/utils/auth-user";
import { ROUTES } from "@/constants/routes";

async function resolvePermissions(user: AuthUser): Promise<EffectivePermissions> {
  const rolePermissions = extractRolePermissions(user);

  if (hasEffectivePermissions(rolePermissions)) {
    return rolePermissions;
  }

  try {
    const effective = await usersApi.getPermissions(user._id);
    if (hasEffectivePermissions(effective)) return effective;
  } catch {
    // Fall through to role lookup.
  }

  if (user.role_id) {
    try {
      const role = await rolesApi.getById(user.role_id);
      const permissions = parseEffectivePermissions(
        role.permissions as EffectivePermissions | undefined
      );
      if (hasEffectivePermissions(permissions)) return permissions;
    } catch {
      // Ignore and use empty permissions; super_admin still bypasses in store.
    }
  }

  return rolePermissions;
}

export function useAuthInit() {
  const setUser = useAuthStore((s) => s.setUser);
  const setPermissions = usePermissionStore((s) => s.setPermissions);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem("accessToken")));
  }, []);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await authApi.me();
      const permissions = await resolvePermissions(user);
      const normalizedUser: AuthUser = {
        ...user,
        role: user.role ? { ...user.role, permissions: permissions as never } : user.role,
      };
      setUser(normalizedUser);
      setPermissions(permissions, user.roleName);
      return normalizedUser;
    },
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const setPermissions = usePermissionStore((s) => s.setPermissions);

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: async (data) => {
      setStoredTokens(data.accessToken, data.refreshToken);
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=900; SameSite=Lax`;

      const user = normalizeAuthUser(data.user as RawAuthUser);
      const permissions = await resolvePermissions(user);

      setUser({
        ...user,
        role: user.role ? { ...user.role, permissions: permissions as never } : user.role,
      });
      setPermissions(permissions, user.roleName);
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      toast.success("Welcome back!");
      router.push(ROUTES.dashboard);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Login failed"));
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearPermissions = usePermissionStore((s) => s.clearPermissions);

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearStoredTokens();
      document.cookie = "accessToken=; path=/; max-age=0";
      clearAuth();
      clearPermissions();
      queryClient.clear();
      router.push(ROUTES.login);
    },
  });
}
