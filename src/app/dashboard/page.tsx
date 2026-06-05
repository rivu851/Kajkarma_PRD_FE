import { PageHeader } from "@/components/layout/page-header";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { ReminderToasts } from "@/components/notifications/reminder-toasts";
import { ProtectedRoute } from "@/components/permissions/protected-route";

export default function DashboardPage() {
  return (
    <ProtectedRoute module="dashboard">
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Read-only overview of your business metrics, alerts, and reminders."
        />
        <ReminderToasts />
        <DashboardOverview />
      </div>
    </ProtectedRoute>
  );
}
