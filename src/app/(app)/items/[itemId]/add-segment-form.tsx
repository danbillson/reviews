"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSegment } from "./actions";

export function AddSegmentForm({ itemId }: { itemId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const formData = new FormData();
    formData.set("itemId", itemId);
    formData.set("title", title);

    startTransition(() => {
      createSegment(formData);
      setTitle("");
      setIsOpen(false);
    });
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => setIsOpen(true)}
      >
        + Add segment
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Chapter, episode, part..."
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !title.trim()}>
          {isPending ? "Adding..." : "Add"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setTitle("");
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
