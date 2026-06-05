import type { AuthUser, EffectivePermissions } from "@/types/auth.types";
import type { Role, SystemRoleName } from "@/types/role.types";

type PopulatedRoleRef = {
  _id: string;
  name?: string;
  description?: string;
  permissions?: EffectivePermissions;
};

export type RawAuthUser = Omit<AuthUser, "role" | "role_id" | "roleName"> & {
  roleName?: string;
  role?: Role;
  role_id?: string | PopulatedRoleRef;
};

export type PermissionsResponse =
  | EffectivePermissions
  | {
      role?: string;
      permissions?: EffectivePermissions;
    };

export function parseEffectivePermissions(
  input?: PermissionsResponse | null
): EffectivePermissions {
  if (!input || typeof input !== "object") return {};

  if (
    "permissions" in input &&
    input.permissions &&
    typeof input.permissions === "object" &&
    !("read" in input.permissions)
  ) {
    return input.permissions;
  }

  return input as EffectivePermissions;
}

export function hasEffectivePermissions(permissions?: EffectivePermissions): boolean {
  const parsed = parseEffectivePermissions(permissions);
  return Object.keys(parsed).length > 0;
}

export function normalizeAuthUser(raw: RawAuthUser): AuthUser {
  const populatedRole =
    typeof raw.role_id === "object" && raw.role_id !== null ? raw.role_id : raw.role;

  const roleId =
    typeof raw.role_id === "string"
      ? raw.role_id
      : populatedRole?._id ??
        (typeof raw.role_id === "object" ? raw.role_id._id : undefined);

  const roleName = (raw.roleName ?? populatedRole?.name ?? raw.role?.name) as
    | SystemRoleName
    | undefined;

  const permissions = parseEffectivePermissions(
    populatedRole?.permissions ?? raw.role?.permissions
  );

  const role: Role | undefined =
    roleId || populatedRole || raw.role
      ? {
          _id: roleId ?? populatedRole?._id ?? raw.role?._id ?? "",
          name: roleName ?? populatedRole?.name ?? raw.role?.name ?? "",
          description: populatedRole?.description ?? raw.role?.description,
          permissions,
        }
      : undefined;

  return {
    ...raw,
    roleName,
    role_id: roleId,
    role,
  };
}

export function extractRolePermissions(user: AuthUser): EffectivePermissions {
  return parseEffectivePermissions(user.role?.permissions as EffectivePermissions | undefined);
}
