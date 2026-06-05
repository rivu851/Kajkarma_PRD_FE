"use client";

import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import { Navbar } from "./navbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />
        <main className="app-main flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
