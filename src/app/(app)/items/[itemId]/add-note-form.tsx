"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createNote } from "./actions";

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

interface AddNoteFormProps {
	itemId: string;
	entries: Entry[];
	segments: Segment[];
}

export function AddNoteForm({ itemId, entries, segments }: AddNoteFormProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [body, setBody] = useState("");
	const [entryId, setEntryId] = useState<string>("");
	const [segmentId, setSegmentId] = useState<string>("");
	const [isPending, startTransition] = useTransition();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!body.trim()) return;

		const formData = new FormData();
		formData.set("itemId", itemId);
		formData.set("body", body);
		if (entryId) formData.set("entryId", entryId);
		if (segmentId) formData.set("segmentId", segmentId);

		startTransition(() => {
			createNote(formData);
			setBody("");
			setEntryId("");
			setSegmentId("");
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
		<form onSubmit={handleSubmit} className="space-y-3 p-4 border rounded-lg bg-card">
			<Textarea
				value={body}
				onChange={(e) => setBody(e.target.value)}
				placeholder="Write your thoughts..."
				rows={3}
				autoFocus
			/>

			<div className="flex flex-wrap gap-4 text-sm">
				{entries.length > 0 && (
					<div className="flex items-center gap-2">
						<label htmlFor="note-entry" className="text-muted-foreground">
							Entry:
						</label>
						<select
							id="note-entry"
							value={entryId}
							onChange={(e) => setEntryId(e.target.value)}
							className="text-sm border rounded px-2 py-1 bg-background"
						>
							<option value="">None</option>
							{entries.map((entry, idx) => (
								<option key={entry.id} value={entry.id}>
									Entry #{entries.length - idx} ({entry.status})
								</option>
							))}
						</select>
					</div>
				)}

				{segments.length > 0 && (
					<div className="flex items-center gap-2">
						<label htmlFor="note-segment" className="text-muted-foreground">
							Segment:
						</label>
						<select
							id="note-segment"
							value={segmentId}
							onChange={(e) => setSegmentId(e.target.value)}
							className="text-sm border rounded px-2 py-1 bg-background"
						>
							<option value="">None</option>
							{segments.map((segment) => (
								<option key={segment.id} value={segment.id}>
									{segment.orderIndex + 1}. {segment.title || `Segment ${segment.orderIndex + 1}`}
								</option>
							))}
						</select>
					</div>
				)}
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
					}}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}
