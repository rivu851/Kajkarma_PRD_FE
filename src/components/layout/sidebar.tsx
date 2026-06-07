"use client";

import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/ui.store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PanelLeftClose, PanelLeft } from "lucide-react";
import { AppLogo } from "@/components/layout/app-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function Sidebar() {
  const { sidebarCollapsed, sidebarHidden, toggleSidebar } = useUiStore();

  return (
    <aside
      className={cn(
        "hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width,transform,opacity] duration-300 ease-in-out lg:sticky lg:top-0 lg:flex",
        sidebarHidden ? "w-0 -translate-x-2 border-r-0 opacity-0" : sidebarCollapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-sidebar-border",
          sidebarCollapsed ? "flex-col px-2 py-3" : "p-3"
        )}
      >
        <AppLogo
          collapsed={sidebarCollapsed}
          className={cn(
            "min-w-0 flex-1 border-0 shadow-none",
            sidebarCollapsed && "w-full justify-center p-1.5"
          )}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <ScrollArea className="h-full min-w-[72px] px-2 pb-8 pt-2">
          <SidebarNav collapsed={sidebarCollapsed} className="pr-1" />
        </ScrollArea>
      </div>
    </aside>
  );
}
