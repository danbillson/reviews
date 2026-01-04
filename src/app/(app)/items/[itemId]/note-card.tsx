"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Note {
  id: string;
  body: string;
  tag: string | null;
  createdAt: Date;
}

interface NoteCardProps {
  note: Note;
}

export function NoteCard({ note }: NoteCardProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {formatDate(note.createdAt)}
          </span>
          {note.tag && (
            <Badge variant="outline" className="text-xs">
              {note.tag}
            </Badge>
          )}
        </div>
        <p className="text-sm whitespace-pre-wrap">{note.body}</p>
      </CardContent>
    </Card>
  );
}
