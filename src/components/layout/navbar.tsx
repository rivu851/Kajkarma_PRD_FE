"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LogOut,
  Menu,
  Moon,
  PanelLeft,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { remindersApi } from "@/services/api/reminders.api";
import { ReminderBellDropdown } from "@/components/drawers/reminder-bell-dropdown";
import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/notification.store";
import { useUiStore } from "@/store/ui.store";
import { useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CommandPalette } from "@/components/layout/command-palette";

export function Navbar() {
  const user = useAuthStore((s) => s.user);
  const { resolvedTheme, setTheme } = useTheme();
  const {
    sidebarHidden,
    setMobileSidebarOpen,
    setCommandPaletteOpen,
    toggleSidebarHidden,
    setSidebarHidden,
  } = useUiStore();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const logout = useLogout();

  const { data: stats } = useQuery({
    queryKey: ["reminders", "stats"],
    queryFn: remindersApi.getStats,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (stats) setUnreadCount(stats.unreadCount);
  }, [stats, setUnreadCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setCommandPaletteOpen]);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleNavToggle = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      if (sidebarHidden) {
        setSidebarHidden(false);
      } else {
        toggleSidebarHidden();
      }
      return;
    }
    setMobileSidebarOpen(true);
  };

  return (
    <>
      <header className="top-header sticky top-0 z-40 flex h-14 items-center gap-2 px-4 font-sans md:gap-3 md:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onClick={handleNavToggle}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5 lg:hidden" />
          <PanelLeft className="hidden h-5 w-5 lg:block" />
        </Button>

        {sidebarHidden ? (
          <span className="hidden text-sm font-semibold text-foreground lg:inline">
            KajKarma IBM
          </span>
        ) : null}

        <Button
          variant="outline"
          className="ml-auto hidden h-9 w-72 justify-start border-primary/15 bg-card text-muted-foreground shadow-sm hover:border-primary/25 sm:flex"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="mr-2 h-4 w-4" />
          Search...
          <kbd className="ml-auto rounded border bg-muted px-1.5 text-xs">Ctrl+K</kbd>
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          className="sm:hidden"
          onClick={() => setCommandPaletteOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        <ReminderBellDropdown />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-lg border border-transparent px-2 transition-colors hover:border-border hover:bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium md:inline">{user?.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 font-sans">
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="font-medium">{user?.name}</div>
                <div className="text-xs font-normal text-muted-foreground">
                  {user?.email}
                </div>
                <div className="mt-1 text-xs capitalize text-muted-foreground">
                  {user?.roleName ?? user?.role?.name}
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout.mutate()}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>
      <CommandPalette />
    </>
  );
}
