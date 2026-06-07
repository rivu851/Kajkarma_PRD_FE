"use client";

import { useUiStore } from "@/store/ui.store";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppLogo } from "@/components/layout/app-logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function MobileSidebar() {
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent side="left" className="w-[min(85vw,280px)] border-r border-sidebar-border bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border p-4">
          <AppLogo href="/dashboard" />
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5.5rem)] px-2 pb-10 pt-2">
          <SidebarNav
            onNavigate={() => setMobileSidebarOpen(false)}
            className="pr-1"
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
