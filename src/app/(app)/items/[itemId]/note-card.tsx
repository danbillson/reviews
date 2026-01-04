"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Note {
	id: string;
	body: string;
	entryId: string | null;
	segmentId: string | null;
	createdAt: Date;
}

interface Entry {
	id: string;
	status: string;
	createdAt: Date;
}

interface Segment {
	id: string;
	orderIndex: number;
	title: string | null;
}

interface NoteCardProps {
	note: Note;
	entries: Entry[];
	segments: Segment[];
}

export function NoteCard({ note, entries, segments }: NoteCardProps) {
	const entry = note.entryId ? entries.find((e) => e.id === note.entryId) : null;
	const segment = note.segmentId
		? segments.find((s) => s.id === note.segmentId)
		: null;

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
					{entry && (
						<Badge variant="outline" className="text-xs capitalize">
							Entry: {entry.status}
						</Badge>
					)}
					{segment && (
						<Badge variant="outline" className="text-xs">
							{segment.orderIndex + 1}. {segment.title || "Segment"}
						</Badge>
					)}
				</div>
				<p className="text-sm whitespace-pre-wrap">{note.body}</p>
			</CardContent>
		</Card>
	);
}
