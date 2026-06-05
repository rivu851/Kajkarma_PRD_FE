"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "@/constants/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { useUiStore } from "@/store/ui.store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";

export function Sidebar() {
  const pathname = usePathname();
  const { canRead } = usePermissions();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();

  const visibleItems = SIDEBAR_ITEMS.filter((item) => canRead(item.module));

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 lg:sticky lg:top-0 lg:flex",
        sidebarCollapsed ? "w-[76px]" : "w-[250px]"
      )}
    >
      <div className="p-4">
        <AppLogo collapsed={sidebarCollapsed} />
      </div>

      <div className="flex items-center justify-end px-3 pb-2">
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          onClick={toggleSidebar}
        >
          {sidebarCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3 pb-4">
        <nav className="space-y-0.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary font-medium text-primary-foreground shadow-sm"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" />
                {!sidebarCollapsed && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
