"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "@/constants/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { useUiStore } from "@/store/ui.store";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AppLogo } from "@/components/layout/app-logo";

export function MobileSidebar() {
  const pathname = usePathname();
  const { canRead } = usePermissions();
  const { mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();
  const visibleItems = SIDEBAR_ITEMS.filter((item) => canRead(item.module));

  return (
    <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
      <SheetContent side="left" className="w-72 border-r border-sidebar-border bg-sidebar p-0">
        <SheetHeader className="border-b border-sidebar-border p-4">
          <AppLogo href="/dashboard" />
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-5.5rem)] p-3">
          <nav className="space-y-0.5">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                    active
                      ? "bg-primary font-medium text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
