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
import { updateEntry } from "./actions";
import { StatusBadge } from "./status-badge";

const STATUSES: { value: EntryStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "started", label: "In Progress" },
  { value: "finished", label: "Finished" },
  { value: "dropped", label: "Dropped" },
];

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
          "focus-visible:ring-0 focus-visible:ring-offset-0 w-auto gap-1",
          "data-[placeholder]:text-foreground cursor-pointer",
          "[&_svg]:hidden", // Hide the dropdown icon
        )}
      >
        <StatusBadge status={currentStatus} />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((status) => (
          <SelectItem key={status.value} value={status.value}>
            {status.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
