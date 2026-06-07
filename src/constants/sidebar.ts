import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Shield,
  Target,
  Building2,
  MessageSquare,
  FolderKanban,
  UserCircle,
  Clock,
  TrendingUp,
  CreditCard,
  CalendarClock,
  Wallet,
  Receipt,
  Repeat,
  FileText,
  Bell,
} from "lucide-react";
import { ROUTES } from "./routes";
import type { ModuleName } from "@/types/role.types";

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  module: ModuleName;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { title: "Dashboard", href: ROUTES.dashboard, icon: LayoutDashboard, module: "dashboard" },
  { title: "Leads", href: ROUTES.leads, icon: Target, module: "leads" },
  { title: "Clients", href: ROUTES.clients, icon: Building2, module: "clients" },
  {
    title: "Communications",
    href: ROUTES.communications,
    icon: MessageSquare,
    module: "communications",
  },
  { title: "Projects", href: ROUTES.projects, icon: FolderKanban, module: "projects" },
  { title: "Employees", href: ROUTES.employees, icon: UserCircle, module: "employees" },
  { title: "Worklogs", href: ROUTES.worklogs, icon: Clock, module: "worklogs" },
  { title: "Salaries", href: ROUTES.salaries, icon: Wallet, module: "salary" },
  { title: "Revenue", href: ROUTES.revenues, icon: TrendingUp, module: "revenue" },
  { title: "Payments", href: ROUTES.payments, icon: CreditCard, module: "payments" },
  {
    title: "Upcoming Payments",
    href: ROUTES.upcomingPayments,
    icon: CalendarClock,
    module: "payments",
  },
  { title: "Reminders", href: ROUTES.reminders, icon: Bell, module: "reminders" },
  { title: "Reports", href: ROUTES.reports, icon: FileText, module: "reports" },
  { title: "Users", href: ROUTES.users, icon: Users, module: "users" },
  { title: "Roles", href: ROUTES.roles, icon: Shield, module: "roles" },
  { title: "Subscriptions", href: ROUTES.subscriptions, icon: Repeat, module: "subscriptions" },
  { title: "Reimbursements", href: ROUTES.reimbursements, icon: Receipt, module: "reimbursements" },
];
