"use client";

import { Badge } from "@/components/ui/badge";
import type { EntryStatus } from "@/db/app-schema";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<EntryStatus, string> = {
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  started: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  finished: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  dropped: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const STATUS_LABELS: Record<EntryStatus, string> = {
  planned: "Planned",
  started: "In Progress",
  finished: "Finished",
  dropped: "Dropped",
};

interface StatusBadgeProps {
  status: EntryStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 capitalize",
        STATUS_COLORS[status],
        className,
      )}
    >
      {STATUS_LABELS[status]}
    </Badge>
  );
}
