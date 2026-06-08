export const LEAD_STAGES = [
  "new",
  "contacted",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export const LEAD_STATUSES = [
  "active",
  "on_hold",
  "unresponsive",
  "dropped",
] as const;

export const CLIENT_STATUSES = [
  "active",
  "on_hold",
  "churned",
  "prospect",
] as const;

export const COMMUNICATION_TYPES = [
  "call",
  "email",
  "whatsapp",
  "meeting",
  "video_call",
] as const;

export const ENTITY_TYPES = ["lead", "client"] as const;

export const PROJECT_CATEGORIES = [
  "web_app",
  "mobile_app",
  "seo",
  "digital_marketing",
  "social_media",
  "graphic_design",
  "content",
] as const;

export const PROJECT_STATUSES = [
  "not_started",
  "in_progress",
  "on_hold",
  "completed",
  "cancelled",
] as const;

export const PROJECT_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const PAYMENT_STATUSES = [
  "unpaid",
  "partially_paid",
  "fully_paid",
] as const;

export const EMPLOYEE_STATUSES = [
  "active",
  "on_leave",
  "resigned",
  "terminated",
] as const;

export const WORK_STATUSES = ["in_progress", "completed", "blocked"] as const;

export const REVENUE_TYPES = ["one_time", "recurring", "milestone"] as const;

export const REVENUE_STATUSES = [
  "pending",
  "partial",
  "received",
  "overdue",
] as const;

export const PAYMENT_METHODS = [
  "bank_transfer",
  "upi",
  "cash",
  "cheque",
  "card",
  "online",
] as const;

export const SALARY_STATUSES = ["pending", "paid", "on_hold"] as const;

export const SALARY_PAYMENT_MODES = [
  "bank_transfer",
  "upi",
  "cash",
  "cheque",
] as const;

export const REIMBURSEMENT_STATUSES = [
  "submitted",
  "under_review",
  "approved",
  "rejected",
  "paid",
] as const;

export const REIMBURSEMENT_CATEGORIES = [
  "travel",
  "meals",
  "office_supplies",
  "software",
  "client_entertainment",
  "other",
] as const;

export const REPORT_TYPES = [
  "monthly_seo",
  "analytics",
  "campaign",
  "audit",
  "other",
] as const;

export const SUBSCRIPTION_STATUSES = [
  "active",
  "expiring_soon",
  "expired",
  "cancelled",
] as const;

export const BILLING_CYCLES = ["monthly", "quarterly", "annual"] as const;

export const UPCOMING_PAYMENT_TYPES = ["confirmed", "expected"] as const;

export const UPCOMING_PAYMENT_STATUSES = [
  "pending",
  "received",
  "overdue",
  "cancelled",
] as const;

export const REMINDER_TYPES = [
  "lead_followup",
  "client_payment",
  "project_deadline",
  "salary_due",
  "report_upload",
  "subscription_renewal",
  "reimbursement_review",
  "communication_followup",
  "custom",
] as const;

export const REMINDER_STATUSES = [
  "pending",
  "done",
  "snoozed",
  "rescheduled",
  "cancelled",
] as const;

export const REMINDER_PRIORITIES = ["low", "medium", "high", "critical"] as const;

export const USER_STATUSES = ["active", "inactive", "suspended"] as const;

export const MODULES = [
  "users",
  "roles",
  "leads",
  "clients",
  "communications",
  "reminders",
  "projects",
  "employees",
  "worklogs",
  "revenue",
  "payments",
  "salary",
  "reimbursements",
  "reports",
  "subscriptions",
  "dashboard",
  "forecasting",
  "attendance",
] as const;
