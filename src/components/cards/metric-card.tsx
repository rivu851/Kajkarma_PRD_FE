import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  className?: string;
}

const ICON_ACCENTS = [
  "bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
  "bg-purple-100 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
];

function accentForTitle(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash += title.charCodeAt(i);
  return ICON_ACCENTS[hash % ICON_ACCENTS.length];
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  className,
}: MetricCardProps) {
  const accent = accentForTitle(title);

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start gap-4">
        {Icon ? (
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              accent
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
