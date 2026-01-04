"use client";

import { Badge } from "@/components/ui/badge";
import type { EntryStatus } from "@/db/app-schema";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark02Icon,
  PlayIcon,
  Tick02Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

const STATUS_CONFIG: Record<
  EntryStatus,
  { icon: typeof Bookmark02Icon; label: string }
> = {
  planned: { icon: Bookmark02Icon, label: "Planned" },
  started: { icon: PlayIcon, label: "In Progress" },
  finished: { icon: Tick02Icon, label: "Finished" },
  dropped: { icon: Cancel01Icon, label: "Dropped" },
};

interface StatusBadgeProps {
  status: EntryStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant="secondary"
      className={className}
      data-icon="inline-start"
    >
      <HugeiconsIcon icon={config.icon} strokeWidth={2} />
      {config.label}
    </Badge>
  );
}
