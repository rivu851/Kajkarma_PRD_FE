import type { ModulePermissions, Role, SystemRoleName } from "./role.types";

export type UserStatus = "active" | "inactive" | "suspended";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  status: UserStatus;
  roleName?: SystemRoleName;
  role?: Role;
  role_id?: string;
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  user: AuthUser;
}

export type EffectivePermissions = Record<string, ModulePermissions>;
