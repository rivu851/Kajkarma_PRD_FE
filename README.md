# KajKarma IBM Frontend

Internal Business Management Tool — enterprise Next.js frontend for the KajKarma BMT backend.

## Stack

- Next.js 16 (App Router)
- TypeScript, Tailwind CSS, shadcn/ui
- TanStack Query, Axios, Zustand
- React Hook Form, Zod, Recharts, Sonner

## Setup

```bash
cd kajkarma-ibm-frontend
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1
```

Start backend on port 5000, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Default seed admin (if backend freshly seeded):

- Email: `admin@kajkarma.com`
- Password: `Admin@123456`

## Architecture

All API contracts are derived from backend documentation (`PRD ENTIRE BACKEND.txt`). No invented endpoints.

- **Auth**: `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`
- **Permissions**: from `user.role.permissions` or `GET /users/:id/permissions`
- **Modules**: dashboard, leads, clients, projects, employees, worklogs, revenue, payments, salaries, reimbursements, subscriptions, reports, reminders, users, roles, communications

## Features

- Role-based sidebar and `PermissionGate` component
- Record-level scoping enforced by backend (frontend does not expose restricted modules)
- Dashboard (read-only) with role-specific metrics from `GET /dashboard/overview`
- Global search (Ctrl+K) across leads, clients, projects, employees
- Reminder bell dropdown + dashboard due-reminder toasts
- Dark/light mode
- Responsive layout with mobile sidebar drawer

## Not implemented (no backend API)

- Lead CSV upload
- Login audit / login details management
- Forecasting module UI (permission exists; no documented endpoints)
- Dedicated file upload storage (reports use `file_url` from backend)
