import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { mediaItem } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AddNoteForm } from "./add-note-form";
import { NoteCard } from "./note-card";

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
    where: and(eq(mediaItem.id, itemId), eq(mediaItem.userId, session.user.id)),
    with: {
      type: true,
      notes: {
        orderBy: (n, { desc }) => [desc(n.createdAt)],
      },
    },
  });

  if (!item) {
    notFound();
  }

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
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {item.title}
            </h1>
            {item.subtitle && (
              <p className="text-lg text-muted-foreground mb-3">
                {item.subtitle}
              </p>
            )}
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-4">
                {item.description}
              </p>
            )}
          </div>
        </div>

        {/* Notes Section */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Notes</h2>

          <AddNoteForm itemId={item.id} />

          {item.notes.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-4">
              No notes yet. Add your thoughts and reflections.
            </p>
          ) : (
            <div className="space-y-3 mt-4">
              {item.notes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
