import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { mediaItem } from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EntryCard } from "./entry-card";
import { AddEntryForm } from "./add-entry-form";
import { AddNoteForm } from "./add-note-form";
import { AddSegmentForm } from "./add-segment-form";
import { NoteCard } from "./note-card";
import { DeleteItemButton } from "./delete-item-button";

export default async function ItemDetailPage({
	params,
}: {
	params: Promise<{ itemId: string }>;
}) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) return null;

	const { itemId } = await params;

	const item = await db.query.mediaItem.findFirst({
		where: and(
			eq(mediaItem.id, itemId),
			eq(mediaItem.userId, session.user.id),
		),
		with: {
			type: true,
			entries: {
				orderBy: (e, { desc }) => [desc(e.createdAt)],
			},
			segments: {
				orderBy: (s, { asc }) => [asc(s.orderIndex)],
			},
			notes: {
				orderBy: (n, { desc }) => [desc(n.createdAt)],
			},
		},
	});

	if (!item) {
		notFound();
	}

	const latestEntry = item.entries[0];

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
				<div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
					<Link
						href="/library"
						className="text-muted-foreground hover:text-foreground transition-colors"
					>
						← Library
					</Link>
				</div>
			</header>

			<main className="max-w-4xl mx-auto px-4 py-8">
				{/* Item Header */}
				<div className="flex gap-6 mb-8">
					{item.imageUrl && (
						<img
							src={item.imageUrl}
							alt=""
							className="w-32 sm:w-40 h-auto object-cover rounded-lg flex-shrink-0"
						/>
					)}
					<div className="flex-1 min-w-0">
						<div className="flex items-start gap-2 mb-2">
							<Badge variant="secondary">{item.type.name}</Badge>
							{latestEntry && (
								<Badge variant="outline" className="capitalize">
									{latestEntry.status}
								</Badge>
							)}
						</div>
						<h1 className="text-2xl sm:text-3xl font-bold mb-1">{item.title}</h1>
						{item.subtitle && (
							<p className="text-lg text-muted-foreground mb-3">{item.subtitle}</p>
						)}
						{item.description && (
							<p className="text-sm text-muted-foreground line-clamp-4">
								{item.description}
							</p>
						)}
					</div>
				</div>

				<div className="grid gap-8 lg:grid-cols-[1fr_300px]">
					<div className="space-y-8">
						{/* Entries Section */}
						<section>
							<div className="flex items-center justify-between mb-4">
								<h2 className="text-xl font-semibold">Entries</h2>
							</div>

							<AddEntryForm itemId={item.id} />

							{item.entries.length === 0 ? (
								<p className="text-sm text-muted-foreground mt-4">
									No entries yet. Create one to track your progress.
								</p>
							) : (
								<div className="space-y-3 mt-4">
									{item.entries.map((entry) => (
										<EntryCard key={entry.id} entry={entry} itemId={item.id} />
									))}
								</div>
							)}
						</section>

						{/* Notes Section */}
						<section>
							<h2 className="text-xl font-semibold mb-4">Notes</h2>

							<AddNoteForm itemId={item.id} entries={item.entries} segments={item.segments} />

							{item.notes.length === 0 ? (
								<p className="text-sm text-muted-foreground mt-4">
									No notes yet. Add your thoughts and reflections.
								</p>
							) : (
								<div className="space-y-3 mt-4">
									{item.notes.map((note) => (
										<NoteCard
											key={note.id}
											note={note}
											entries={item.entries}
											segments={item.segments}
										/>
									))}
								</div>
							)}
						</section>
					</div>

					<div className="space-y-6">
						{/* Segments Section */}
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-base">Segments</CardTitle>
							</CardHeader>
							<CardContent>
								<AddSegmentForm itemId={item.id} />

								{item.segments.length === 0 ? (
									<p className="text-sm text-muted-foreground mt-3">
										No segments. Add chapters, episodes, or parts.
									</p>
								) : (
									<ul className="mt-3 space-y-1">
										{item.segments.map((segment, idx) => (
											<li
												key={segment.id}
												className="text-sm py-1 border-b border-border last:border-0"
											>
												<span className="text-muted-foreground mr-2">
													{idx + 1}.
												</span>
												{segment.title || `Segment ${idx + 1}`}
											</li>
										))}
									</ul>
								)}
							</CardContent>
						</Card>

						{/* Metadata */}
						{item.metadata && Object.keys(item.metadata).length > 0 && (
							<Card>
								<CardHeader className="pb-3">
									<CardTitle className="text-base">Details</CardTitle>
								</CardHeader>
								<CardContent>
									<dl className="space-y-2 text-sm">
										{Object.entries(item.metadata as Record<string, unknown>)
											.filter(
												([_, v]) =>
													v !== null &&
													v !== undefined &&
													!(Array.isArray(v) && v.length === 0),
											)
											.slice(0, 8)
											.map(([key, value]) => (
												<div key={key}>
													<dt className="text-muted-foreground capitalize">
														{key.replace(/([A-Z])/g, " $1").trim()}
													</dt>
													<dd className="font-medium">
														{Array.isArray(value)
															? value.slice(0, 3).join(", ")
															: String(value)}
													</dd>
												</div>
											))}
									</dl>
								</CardContent>
							</Card>
						)}

						{/* Danger Zone */}
						<Card className="border-destructive/50">
							<CardHeader className="pb-3">
								<CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
							</CardHeader>
							<CardContent>
								<DeleteItemButton itemId={item.id} itemTitle={item.title} />
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
