"use client";

import { usePermissions, usePermissionsReady } from "@/hooks/use-permissions";
import type { ModuleName } from "@/types/role.types";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { formatLabel } from "@/utils/format";

interface ProtectedRouteProps {
  module: ModuleName;
  children: React.ReactNode;
}

export function ProtectedRoute({ module, children }: ProtectedRouteProps) {
  const { canRead } = usePermissions();
  const ready = usePermissionsReady();
  const allowed = canRead(module);

  if (!ready) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium">Access restricted</p>
          <p className="mt-2 text-sm text-muted-foreground">
            You do not have permission to view {formatLabel(module)}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
