"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SIDEBAR_ITEMS } from "@/constants/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { isSidebarItemActive } from "@/utils/nav-active";

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({
  collapsed = false,
  onNavigate,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();
  const { canRead } = usePermissions();
  const visibleItems = SIDEBAR_ITEMS.filter((item) => canRead(item.module));

  return (
    <nav className={cn("space-y-1 font-sans", className)}>
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = isSidebarItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.title : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              collapsed && "justify-center px-2.5"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
              )}
            />
            <span
              className={cn(
                "truncate transition-all duration-300",
                collapsed ? "w-0 overflow-hidden opacity-0" : "w-auto opacity-100"
              )}
            >
              {item.title}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
