import type { UserStatus } from "./auth.types";

export interface User {
  _id: string;
  name: string;
  email: string;
  status: UserStatus;
  role_id: string;
  role?: { _id: string; name: string };
  source?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role_id: string;
  source?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  source?: string;
}
