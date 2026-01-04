"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EntryStatus } from "@/db/app-schema";
import { importItemWithStatus } from "./actions";

interface AddItemWithStatusFormProps {
  typeId: string;
  externalId: string;
  providerKey: string;
  providerConfig?: Record<string, unknown>;
  mediaTypeSlug: string;
}

const STATUS_LABELS: Record<EntryStatus, string> = {
  planned: "Plan to consume",
  started: "Started",
  finished: "Finished",
  dropped: "Dropped",
};

export function AddItemWithStatusForm({
  typeId,
  externalId,
  providerKey,
  mediaTypeSlug,
}: AddItemWithStatusFormProps) {
  const [isPending, startTransition] = useTransition();

  const handleAdd = (status: EntryStatus) => {
    const formData = new FormData();
    formData.set("typeId", typeId);
    formData.set("externalId", externalId);
    formData.set("status", status);

    startTransition(() => {
      importItemWithStatus(formData);
    });
  };

  // Single consume items (movies)
  const isSingleConsume = mediaTypeSlug === "movies";

  // Books - special case with reading/completed CTAs
  const isBook = mediaTypeSlug === "books";

  // Longer form items (games, series, anime, manga)
  const isLongForm =
    mediaTypeSlug === "tv-shows" ||
    mediaTypeSlug === "anime" ||
    mediaTypeSlug === "manga" ||
    mediaTypeSlug === "games";

  if (isSingleConsume) {
    // Movies: Add to wishlist + Add to library (with status selection dropdown)
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleAdd("planned")}
          disabled={isPending}
        >
          {isPending ? "Adding..." : "Add to Wishlist"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="default" size="lg" disabled={isPending}>
              {isPending ? "Adding..." : "Add to Library"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleAdd("started")}>
              {STATUS_LABELS.started}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAdd("finished")}>
              {STATUS_LABELS.finished}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAdd("dropped")}>
              {STATUS_LABELS.dropped}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (isBook) {
    // Books: Add to wishlist + Currently reading + Mark as completed
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleAdd("planned")}
          disabled={isPending}
        >
          {isPending ? "Adding..." : "Add to Wishlist"}
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={() => handleAdd("started")}
          disabled={isPending}
        >
          {isPending ? "Adding..." : "Currently Reading"}
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={() => handleAdd("finished")}
          disabled={isPending}
        >
          {isPending ? "Adding..." : "Mark as Completed"}
        </Button>
      </div>
    );
  }

  if (isLongForm) {
    // Longer items: Add to wishlist + Start
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleAdd("planned")}
          disabled={isPending}
        >
          {isPending ? "Adding..." : "Add to Wishlist"}
        </Button>
        <Button
          variant="default"
          size="lg"
          onClick={() => handleAdd("started")}
          disabled={isPending}
        >
          {isPending ? "Adding..." : "Start"}
        </Button>
      </div>
    );
  }

  // Default: show all options
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="lg"
        onClick={() => handleAdd("planned")}
        disabled={isPending}
      >
        {isPending ? "Adding..." : "Add to Wishlist"}
      </Button>
      <Button
        variant="default"
        size="lg"
        onClick={() => handleAdd("started")}
        disabled={isPending}
      >
        {isPending ? "Adding..." : "Start"}
      </Button>
    </div>
  );
}
