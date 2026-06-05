export const ROUTES = {
  login: "/login",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  users: "/dashboard/users",
  roles: "/dashboard/roles",
  leads: "/dashboard/leads",
  clients: "/dashboard/clients",
  communications: "/dashboard/communications",
  projects: "/dashboard/projects",
  employees: "/dashboard/employees",
  worklogs: "/dashboard/worklogs",
  revenues: "/dashboard/revenues",
  payments: "/dashboard/payments",
  upcomingPayments: "/dashboard/upcoming-payments",
  salaries: "/dashboard/salaries",
  reimbursements: "/dashboard/reimbursements",
  subscriptions: "/dashboard/subscriptions",
  reports: "/dashboard/reports",
  reminders: "/dashboard/reminders",
} as const;

export const PUBLIC_ROUTES = [ROUTES.login, ROUTES.forgotPassword];
