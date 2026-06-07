import { ROUTES } from "@/constants/routes";

export function isSidebarItemActive(pathname: string, href: string): boolean {
  if (href === ROUTES.dashboard) {
    return pathname === ROUTES.dashboard;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
