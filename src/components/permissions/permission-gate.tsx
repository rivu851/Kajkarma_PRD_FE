"use client";

import { useCan } from "@/hooks/use-permissions";
import type { ModuleName, PermissionAction } from "@/types/role.types";

interface PermissionGateProps {
  module: ModuleName;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  module,
  action,
  children,
  fallback = null,
}: PermissionGateProps) {
  const allowed = useCan(module, action);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
