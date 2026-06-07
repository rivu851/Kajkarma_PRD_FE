"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  Clock,
  CreditCard,
  FolderKanban,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Bell,
  Repeat,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { dashboardApi } from "@/services/api/dashboard.api";
import { MetricCard } from "@/components/cards/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, formatLabel } from "@/utils/format";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-1)",
];

const CHART_ANIMATION = {
  isAnimationActive: true,
  animationDuration: 900,
  animationBegin: 0,
  animationEasing: "ease-out" as const,
};

const PIE_LABEL = ({
  name,
  percent,
}: {
  name?: string;
  percent?: number;
}) => `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`;

const SEVERITY_VARIANT: Record<string, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  high: "destructive",
  medium: "secondary",
  low: "outline",
};

export function DashboardOverview() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["dashboard", "overview"],
    queryFn: dashboardApi.getOverview,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Unable to load dashboard. Ensure backend is running and you have dashboard:read permission.
          {error instanceof Error ? (
            <p className="mt-2 text-xs">{error.message}</p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  const leadFunnel = Object.entries(data.leadMetrics?.leadStageBreakdown ?? {}).map(
    ([stage, value]) => ({ name: formatLabel(stage), value })
  );

  const projectStatus = data.projectMetrics
    ? [
        { name: "Active", value: data.projectMetrics.activeProjects },
        { name: "Completed", value: data.projectMetrics.completedProjects },
        { name: "On Hold", value: data.projectMetrics.onHoldProjects },
        { name: "Cancelled", value: data.projectMetrics.cancelledProjects },
      ].filter((item) => item.value > 0)
    : [];

  const revenueTrend = data.revenueMetrics?.monthlyRevenueTrend ?? [];

  const clientBreakdown = data.clientMetrics
    ? [
        { name: "Active", value: data.clientMetrics.activeClients },
        { name: "Prospect", value: data.clientMetrics.prospectClients },
        { name: "On Hold", value: data.clientMetrics.onHoldClients },
        { name: "Churned", value: data.clientMetrics.churnedClients },
      ].filter((item) => item.value > 0)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Badge variant="default" className="capitalize">
          View: {data.view}
        </Badge>
        {data.generatedAt ? (
          <span className="text-xs text-muted-foreground">
            Updated {formatDate(data.generatedAt)}
          </span>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {data.leadMetrics ? (
          <>
            <MetricCard title="Total Leads" value={data.leadMetrics.totalLeads} icon={Target} />
            <MetricCard title="Active Leads" value={data.leadMetrics.activeLeads} icon={Target} />
            <MetricCard
              title="Overdue Follow-ups"
              value={data.leadMetrics.overdueFollowups}
              description={`${data.leadMetrics.todayFollowups} due today`}
              icon={Clock}
            />
          </>
        ) : null}

        {data.clientMetrics ? (
          <>
            <MetricCard title="Total Clients" value={data.clientMetrics.totalClients} icon={Building2} />
            <MetricCard title="Active Clients" value={data.clientMetrics.activeClients} icon={Building2} />
            <MetricCard
              title="New This Month"
              value={data.clientMetrics.newClientsThisMonth}
              icon={Building2}
            />
          </>
        ) : null}

        {data.projectMetrics ? (
          <>
            <MetricCard title="Total Projects" value={data.projectMetrics.totalProjects} icon={FolderKanban} />
            <MetricCard title="Active Projects" value={data.projectMetrics.activeProjects} icon={FolderKanban} />
            <MetricCard
              title="Overdue Projects"
              value={data.projectMetrics.overdueProjects}
              description={`${data.projectMetrics.projectsEndingWithin7Days} ending within 7 days`}
              icon={FolderKanban}
            />
          </>
        ) : null}

        {data.revenueMetrics ? (
          <>
            <MetricCard
              title="Revenue Received"
              value={formatCurrency(data.revenueMetrics.allTimeReceivedRevenue)}
              icon={TrendingUp}
            />
            <MetricCard
              title="Revenue Pending"
              value={formatCurrency(data.revenueMetrics.allTimePendingRevenue)}
              icon={TrendingUp}
            />
            <MetricCard
              title="This Month Received"
              value={formatCurrency(data.revenueMetrics.currentMonthReceivedRevenue)}
              icon={TrendingUp}
            />
          </>
        ) : null}

        {data.paymentMetrics ? (
          <>
            <MetricCard
              title="Payments Due (7d)"
              value={data.paymentMetrics.paymentsDue7Days}
              icon={CreditCard}
            />
            <MetricCard
              title="Overdue Payments"
              value={data.paymentMetrics.totalOverduePayments}
              description={formatCurrency(data.paymentMetrics.overdueAmount)}
              icon={CreditCard}
            />
          </>
        ) : null}

        {data.salaryMetrics ? (
          <MetricCard
            title="Pending Salaries"
            value={data.salaryMetrics.pendingSalaryCount}
            description={formatCurrency(data.salaryMetrics.pendingSalaryAmount)}
            icon={Wallet}
          />
        ) : null}

        {data.reimbursementMetrics ? (
          <MetricCard
            title="Reimbursements Pending"
            value={
              data.reimbursementMetrics.pendingApprovalCount +
              data.reimbursementMetrics.approvedAwaitingPaymentCount
            }
            description={formatCurrency(data.reimbursementMetrics.pendingAmount)}
            icon={Wallet}
          />
        ) : null}

        {data.subscriptionMetrics ? (
          <>
            <MetricCard
              title="Active Subscriptions"
              value={data.subscriptionMetrics.activeSubscriptions}
              icon={Repeat}
            />
            <MetricCard
              title="Expiring (30d)"
              value={data.subscriptionMetrics.expiringWithin30Days}
              icon={Repeat}
            />
          </>
        ) : null}

        {data.communicationMetrics ? (
          <MetricCard
            title="Communications Today"
            value={data.communicationMetrics.todayCommunications}
            description={`${data.communicationMetrics.monthlyCommunications} this month`}
            icon={Users}
          />
        ) : null}

        {data.reminderMetrics ? (
          <>
            <MetricCard title="Unread Reminders" value={data.reminderMetrics.unreadCount} icon={Bell} />
            <MetricCard title="Overdue Reminders" value={data.reminderMetrics.overdueCount} icon={Bell} />
            <MetricCard title="Critical Reminders" value={data.reminderMetrics.criticalCount} icon={Bell} />
          </>
        ) : null}

        {data.teamSummary ? (
          <>
            <MetricCard
              title="Assigned Projects"
              value={data.teamSummary.assignedProjects.length}
              description={`${data.teamSummary.workSummary.hoursLoggedThisWeek}h logged this week`}
              icon={FolderKanban}
            />
            <MetricCard
              title="Blocked Tasks"
              value={data.teamSummary.workSummary.blockedTasks}
              description={`${data.teamSummary.workSummary.tasksInProgress} in progress`}
              icon={Clock}
            />
          </>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {leadFunnel.length > 0 ? (
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Lead Funnel</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadFunnel}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    {...CHART_ANIMATION}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {clientBreakdown.length > 0 ? (
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Client Status</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientBreakdown}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={clientBreakdown.length > 1 ? 3 : 0}
                    startAngle={90}
                    endAngle={-270}
                    label={PIE_LABEL}
                    labelLine={{ strokeWidth: 1 }}
                    {...CHART_ANIMATION}
                  >
                    {clientBreakdown.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {revenueTrend.length > 0 ? (
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Monthly Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="received"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    {...CHART_ANIMATION}
                    animationBegin={0}
                  />
                  <Line
                    type="monotone"
                    dataKey="pending"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    {...CHART_ANIMATION}
                    animationBegin={150}
                  />
                  <Line
                    type="monotone"
                    dataKey="expected"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    {...CHART_ANIMATION}
                    animationBegin={300}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {projectStatus.length > 0 ? (
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={projectStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={88}
                    paddingAngle={projectStatus.length > 1 ? 3 : 0}
                    startAngle={90}
                    endAngle={-270}
                    label={PIE_LABEL}
                    labelLine={{ strokeWidth: 1 }}
                    {...CHART_ANIMATION}
                  >
                    {projectStatus.map((_, index) => (
                      <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : null}

        {data.employeeProductivity && data.employeeProductivity.length > 0 ? (
          <Card className="dashboard-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Employee Productivity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Employee</th>
                      <th className="pb-2 pr-4">Completed</th>
                      <th className="pb-2 pr-4">In Progress</th>
                      <th className="pb-2 pr-4">Blocked</th>
                      <th className="pb-2 pr-4">Hours (Week)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.employeeProductivity.map((row, i) => (
                      <tr key={`${row.employeeId}-${i}`} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{row.employeeName}</td>
                        <td className="py-2 pr-4">{row.tasksCompleted}</td>
                        <td className="py-2 pr-4">{row.tasksInProgress}</td>
                        <td className="py-2 pr-4">{row.blockedTasks}</td>
                        <td className="py-2 pr-4">{row.hoursLoggedThisWeek}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data.alerts.length > 0 ? (
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.alerts.map((alert, i) => (
                <div
                  key={`${alert.type}-${alert.recordId}-${i}`}
                  className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                  <Badge variant={SEVERITY_VARIANT[alert.severity] ?? "outline"}>
                    {formatLabel(alert.severity)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {data.recentReminders.length > 0 ? (
          <Card className="dashboard-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Reminders</CardTitle>
              <Link href={ROUTES.reminders} className="text-sm text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.recentReminders.map((reminder, i) => (
                <div
                  key={`${reminder.reminderId ?? reminder.recordId}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <div>
                    <p className="font-medium">{reminder.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(reminder.dueDate)} · {formatLabel(reminder.type)}
                    </p>
                  </div>
                  {reminder.priority ? (
                    <Badge
                      variant={reminder.priority === "critical" ? "destructive" : "secondary"}
                    >
                      {formatLabel(reminder.priority)}
                    </Badge>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
