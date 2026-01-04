"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { deleteItem } from "./actions";

interface DeleteItemButtonProps {
  itemId: string;
  itemTitle: string;
}

export function DeleteItemButton({ itemId, itemTitle }: DeleteItemButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (
      !confirm(
        `Are you sure you want to delete "${itemTitle}"? This will also delete all entries, notes, and segments.`,
      )
    ) {
      return;
    }

    const formData = new FormData();
    formData.set("itemId", itemId);

    startTransition(async () => {
      await deleteItem(formData);
      router.push("/library");
    });
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleDelete}
      disabled={isPending}
      className="w-full"
    >
      {isPending ? "Deleting..." : "Delete item"}
    </Button>
  );
}
