"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthProvider } from "@/components/providers/auth-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuthStore } from "@/store/auth.store";
import { usePermissionStore } from "@/store/permission.store";
import { useAuthInit } from "@/hooks/use-auth";
import { ROUTES } from "@/constants/routes";

function DashboardAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const clearPermissions = usePermissionStore((s) => s.clearPermissions);
  const { isError, isFetched } = useAuthInit();

  useEffect(() => {
    // Only redirect once the auth check has settled and definitively failed.
    // This allows the refresh interceptor to run first when the access token
    // is expired but a valid HttpOnly refresh token cookie is present.
    if (isFetched && isError && !isAuthenticated) {
      clearAuth();
      clearPermissions();
      router.replace(ROUTES.login);
    }
  }, [isFetched, isError, isAuthenticated, clearAuth, clearPermissions, router]);

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <DashboardAuthGuard>
        <DashboardShell>{children}</DashboardShell>
      </DashboardAuthGuard>
    </AuthProvider>
  );
}
