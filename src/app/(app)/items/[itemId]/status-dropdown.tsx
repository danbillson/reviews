"use client";

import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { EntryStatus } from "@/db/app-schema";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Bookmark02Icon,
  PlayIcon,
  Tick02Icon,
  Cancel01Icon,
  ArrowDown01Icon,
} from "@hugeicons/core-free-icons";
import { updateEntry } from "./actions";
import { StatusBadge } from "./status-badge";

const STATUS_CONFIG: Record<
  EntryStatus,
  { icon: typeof Bookmark02Icon; label: string }
> = {
  planned: { icon: Bookmark02Icon, label: "Planned" },
  started: { icon: PlayIcon, label: "In Progress" },
  finished: { icon: Tick02Icon, label: "Finished" },
  dropped: { icon: Cancel01Icon, label: "Dropped" },
};

const STATUSES: EntryStatus[] = ["planned", "started", "finished", "dropped"];

interface StatusDropdownProps {
  entryId: string;
  itemId: string;
  currentStatus: EntryStatus;
}

export function StatusDropdown({
  entryId,
  itemId,
  currentStatus,
}: StatusDropdownProps) {
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (newStatus: EntryStatus) => {
    if (newStatus === currentStatus) return;

    const formData = new FormData();
    formData.set("entryId", entryId);
    formData.set("itemId", itemId);
    formData.set("status", newStatus);

    startTransition(() => {
      updateEntry(formData);
    });
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isPending}
    >
      <SelectTrigger
        className={cn(
          "h-auto p-0 border-0 shadow-none bg-transparent hover:bg-transparent",
          "focus-visible:ring-0 focus-visible:ring-offset-0 w-auto",
          "data-[placeholder]:text-foreground cursor-pointer",
          "[&>*:last-child]:hidden", // Hide the default dropdown icon
        )}
      >
        <div className="inline-flex items-center gap-1.5 h-5 px-2 py-0.5 bg-secondary text-secondary-foreground rounded-none border border-transparent text-xs font-medium">
          <div className="flex items-center gap-1">
            <HugeiconsIcon
              icon={STATUS_CONFIG[currentStatus].icon}
              strokeWidth={2}
              className="size-3 pointer-events-none"
            />
            <span>{STATUS_CONFIG[currentStatus].label}</span>
          </div>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            strokeWidth={2}
            className="size-3 shrink-0 pointer-events-none"
          />
        </div>
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => {
          const config = STATUS_CONFIG[status];
          return (
            <SelectItem key={status} value={status}>
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={config.icon} strokeWidth={2} />
                {config.label}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
