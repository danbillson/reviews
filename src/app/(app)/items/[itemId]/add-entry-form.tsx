"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { EntryStatus } from "@/db/app-schema";
import { createEntry } from "./actions";

const STATUSES: { value: EntryStatus; label: string }[] = [
  { value: "planned", label: "Plan to consume" },
  { value: "started", label: "Started" },
  { value: "finished", label: "Finished" },
  { value: "dropped", label: "Dropped" },
];

export function AddEntryForm({ itemId }: { itemId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleCreate = (status: EntryStatus) => {
    const formData = new FormData();
    formData.set("itemId", itemId);
    formData.set("status", status);

    startTransition(() => {
      createEntry(formData);
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((status) => (
        <Button
          key={status.value}
          variant="outline"
          size="sm"
          onClick={() => handleCreate(status.value)}
          disabled={isPending}
        >
          + {status.label}
        </Button>
      ))}
    </div>
  );
}
