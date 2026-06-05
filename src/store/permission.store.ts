import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EffectivePermissions } from "@/types/auth.types";
import type { ModuleName, PermissionAction } from "@/types/role.types";
import { hasModulePermission } from "@/constants/permissions";
import { parseEffectivePermissions } from "@/utils/auth-user";

interface PermissionState {
  permissions: EffectivePermissions;
  roleName?: string;
  setPermissions: (permissions: EffectivePermissions, roleName?: string) => void;
  can: (module: ModuleName, action: PermissionAction) => boolean;
  clearPermissions: () => void;
}

export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: {},
      roleName: undefined,
      setPermissions: (permissions, roleName) => set({ permissions, roleName }),
      can: (module, action) =>
        hasModulePermission(get().permissions, module, action, get().roleName),
      clearPermissions: () => set({ permissions: {}, roleName: undefined }),
    }),
    {
      name: "kajkarma-permissions",
      partialize: (state) => ({
        permissions: state.permissions,
        roleName: state.roleName,
      }),
      merge: (persisted, current) => {
        const saved = persisted as PermissionState | undefined;
        if (!saved) return current;
        return {
          ...current,
          ...saved,
          permissions: parseEffectivePermissions(saved.permissions),
        };
      },
    }
  )
);
