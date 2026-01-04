"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EntryStatus } from "@/db/app-schema";
import { deleteEntry, updateEntry } from "./actions";

interface Entry {
  id: string;
  status: EntryStatus;
  startedAt: Date | null;
  finishedAt: Date | null;
  droppedAt: Date | null;
  recommend: boolean | null;
  score: number | null;
  createdAt: Date;
}

const STATUSES: { value: EntryStatus; label: string }[] = [
  { value: "planned", label: "Planned" },
  { value: "started", label: "In Progress" },
  { value: "finished", label: "Finished" },
  { value: "dropped", label: "Dropped" },
];

export function EntryCard({ entry, itemId }: { entry: Entry; itemId: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleUpdate = (
    updates: Partial<{
      status: EntryStatus;
      recommend: boolean | null;
      score: number | null;
    }>,
  ) => {
    const formData = new FormData();
    formData.set("entryId", entry.id);
    formData.set("itemId", itemId);

    if (updates.status !== undefined) {
      formData.set("status", updates.status);
    }
    if (updates.recommend !== undefined) {
      formData.set(
        "recommend",
        updates.recommend === null ? "" : String(updates.recommend),
      );
    }
    if (updates.score !== undefined) {
      formData.set(
        "score",
        updates.score === null ? "" : String(updates.score),
      );
    }

    startTransition(() => {
      updateEntry(formData);
    });
  };

  const handleDelete = () => {
    if (!confirm("Delete this entry?")) return;

    const formData = new FormData();
    formData.set("entryId", entry.id);
    formData.set("itemId", itemId);

    startTransition(() => {
      deleteEntry(formData);
    });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize">
                {entry.status}
              </Badge>
              {entry.recommend !== null && (
                <Badge variant={entry.recommend ? "default" : "secondary"}>
                  {entry.recommend ? "Recommended" : "Not recommended"}
                </Badge>
              )}
              {entry.score !== null && (
                <Badge variant="secondary">{entry.score}/100</Badge>
              )}
            </div>

            <div className="text-xs text-muted-foreground space-x-3">
              <span>Created {formatDate(entry.createdAt)}</span>
              {entry.startedAt && (
                <span>· Started {formatDate(entry.startedAt)}</span>
              )}
              {entry.finishedAt && (
                <span>· Finished {formatDate(entry.finishedAt)}</span>
              )}
              {entry.droppedAt && (
                <span>· Dropped {formatDate(entry.droppedAt)}</span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Done" : "Edit"}
          </Button>
        </div>

        {isEditing && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Status</Label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <Button
                    key={s.value}
                    variant={entry.status === s.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleUpdate({ status: s.value })}
                    disabled={isPending}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Recommendation</Label>
              <div className="flex gap-2">
                <Button
                  variant={entry.recommend === true ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleUpdate({
                      recommend: entry.recommend === true ? null : true,
                    })
                  }
                  disabled={isPending}
                >
                  👍 Recommend
                </Button>
                <Button
                  variant={entry.recommend === false ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleUpdate({
                      recommend: entry.recommend === false ? null : false,
                    })
                  }
                  disabled={isPending}
                >
                  👎 Don't recommend
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`score-${entry.id}`} className="text-xs">
                Score (0-100)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`score-${entry.id}`}
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={entry.score ?? ""}
                  className="w-24"
                  onBlur={(e) => {
                    const val = e.target.value;
                    const score = val === "" ? null : Number.parseInt(val, 10);
                    if (score !== entry.score) {
                      handleUpdate({ score });
                    }
                  }}
                />
                {entry.score !== null && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUpdate({ score: null })}
                    disabled={isPending}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isPending}
              >
                Delete entry
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
