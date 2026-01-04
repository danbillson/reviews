import {
  Book01Icon,
  Bookmark02Icon,
  Cancel01Icon,
  Film01Icon,
  GameIcon,
  MusicNote01Icon,
  PlayIcon,
  Tick02Icon,
  Tv01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EntryStatus } from "@/db/app-schema";
import { db } from "@/db/client";
import { mediaItem } from "@/db/schema";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

// Status badge icons and labels
const STATUS_CONFIG: Record<
  EntryStatus,
  { icon: typeof Bookmark02Icon; label: string }
> = {
  planned: { icon: Bookmark02Icon, label: "Planned" },
  started: { icon: PlayIcon, label: "In Progress" },
  finished: { icon: Tick02Icon, label: "Finished" },
  dropped: { icon: Cancel01Icon, label: "Dropped" },
};

// Media type icons mapping
const MEDIA_TYPE_ICONS: Record<string, typeof Book01Icon> = {
  books: Book01Icon,
  movies: Film01Icon,
  "tv-shows": Tv01Icon,
  music: MusicNote01Icon,
  games: GameIcon,
};

// Default icon for unknown media types
const DEFAULT_MEDIA_ICON = Book01Icon;

export default async function LibraryPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  // Get user's items with their latest entry
  const items = await db.query.mediaItem.findMany({
    where: eq(mediaItem.userId, session.user.id),
    with: {
      type: true,
      entries: {
        orderBy: (entry, { desc }) => [desc(entry.createdAt)],
        limit: 1,
      },
    },
    orderBy: (mediaItem, { desc }) => [desc(mediaItem.updatedAt)],
  });

  // Separate in-progress items (status "started")
  const inProgressItems = items.filter(
    (item) => item.entries[0]?.status === "started",
  );
  const otherItems = items.filter(
    (item) => item.entries[0]?.status !== "started",
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/library"
            className="text-xl font-semibold hover:opacity-80"
          >
            Reviews
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {session.user.name || session.user.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Library</h2>
          <Link href="/items/new">
            <Button>Add Item</Button>
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Your library is empty. Add some media to get started.
            </p>
            <Link href="/items/new">
              <Button variant="outline">Add your first item</Button>
            </Link>
          </div>
        ) : (
          <>
            {inProgressItems.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">In Progress</h3>
                <div className="space-y-1">
                  {inProgressItems.map((item) => {
                    const entry = item.entries[0];
                    return (
                      <Link
                        key={item.id}
                        href={`/items/${item.id}`}
                        className="group flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-12 h-16 sm:w-16 sm:h-24 bg-muted overflow-hidden shrink-0 shadow-sm">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-1 text-center">
                              {item.title}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {entry && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                data-icon="inline-start"
                              >
                                <HugeiconsIcon
                                  icon={STATUS_CONFIG[entry.status].icon}
                                  strokeWidth={2}
                                />
                                {STATUS_CONFIG[entry.status].label}
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              data-icon="inline-start"
                            >
                              <HugeiconsIcon
                                icon={
                                  MEDIA_TYPE_ICONS[item.type.slug] ||
                                  DEFAULT_MEDIA_ICON
                                }
                                strokeWidth={2}
                              />
                              {item.type.name}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {otherItems.length > 0 && (
              <div>
                {inProgressItems.length > 0 && (
                  <h3 className="text-xl font-semibold mb-4">All Items</h3>
                )}
                <div className="space-y-1">
                  {otherItems.map((item) => {
                    const entry = item.entries[0];
                    return (
                      <Link
                        key={item.id}
                        href={`/items/${item.id}`}
                        className="group flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-12 h-16 sm:w-16 sm:h-24 bg-muted overflow-hidden shrink-0 shadow-sm">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-1 text-center">
                              {item.title}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-base group-hover:text-primary transition-colors truncate">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="text-sm text-muted-foreground truncate">
                              {item.subtitle}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {entry && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                                data-icon="inline-start"
                              >
                                <HugeiconsIcon
                                  icon={STATUS_CONFIG[entry.status].icon}
                                  strokeWidth={2}
                                />
                                {STATUS_CONFIG[entry.status].label}
                              </Badge>
                            )}
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              data-icon="inline-start"
                            >
                              <HugeiconsIcon
                                icon={
                                  MEDIA_TYPE_ICONS[item.type.slug] ||
                                  DEFAULT_MEDIA_ICON
                                }
                                strokeWidth={2}
                              />
                              {item.type.name}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
