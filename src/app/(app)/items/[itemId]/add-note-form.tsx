"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "./actions";

interface AddNoteFormProps {
  itemId: string;
}

export function AddNoteForm({ itemId }: AddNoteFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    const formData = new FormData();
    formData.set("itemId", itemId);
    formData.set("body", body);
    if (tag.trim()) formData.set("tag", tag.trim());

    startTransition(() => {
      createNote(formData);
      setBody("");
      setTag("");
      setIsOpen(false);
    });
  };

  if (!isOpen) {
    return (
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        + Add note
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 border bg-card">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your thoughts..."
        rows={3}
        autoFocus
      />

      <div className="space-y-2">
        <Label htmlFor="note-tag" className="text-sm text-muted-foreground">
          Tag (optional)
        </Label>
        <Input
          id="note-tag"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="e.g., chapter one, episode 5"
          className="text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
          {isPending ? "Saving..." : "Save note"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setBody("");
            setTag("");
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
