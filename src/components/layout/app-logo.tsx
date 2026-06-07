import Link from "next/link";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/layout/logo-mark";

interface AppLogoProps {
  collapsed?: boolean;
  showText?: boolean;
  linkable?: boolean;
  href?: string;
  className?: string;
}

export function AppLogo({
  collapsed = false,
  showText = true,
  linkable = true,
  href = "/dashboard",
  className,
}: AppLogoProps) {
  const content = (
    <>
      <LogoMark size={collapsed ? 36 : 44} />
      {showText && !collapsed && (
        <span className="text-sm font-semibold leading-tight text-foreground">
          KajKarma
          <span className="block text-xs font-normal text-muted-foreground">IBM</span>
        </span>
      )}
    </>
  );

  const wrapperClass = cn(
    "flex items-center rounded-xl border border-border/80 bg-card p-2.5 font-sans shadow-sm transition-shadow hover:shadow-md",
    collapsed ? "justify-center" : "gap-3",
    className
  );

  if (linkable) {
    return (
      <Link href={href} className={wrapperClass}>
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
