import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/layout/app-logo";

export default function ForgotPasswordPage() {
  return (
    <div className="auth-backdrop flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="space-y-4">
          <AppLogo linkable={false} className="mx-auto w-fit justify-center" />
          <CardTitle>Forgot Password</CardTitle>
          <CardDescription>
            Password reset is managed by your administrator. Contact super_admin or admin to reset your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/login"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
