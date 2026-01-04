import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { mediaItem } from "@/db/schema";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SignOutButton } from "./sign-out-button";

// Color palette for media type badges
const MEDIA_TYPE_COLORS = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
] as const;

// Get a consistent color for a media type based on its slug
function getMediaTypeColor(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash + slug.charCodeAt(i)) & 0xffffffff;
  }
  return MEDIA_TYPE_COLORS[Math.abs(hash) % MEDIA_TYPE_COLORS.length] || "";
}

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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {inProgressItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/items/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2 shadow-sm">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-fit"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                            {item.title}
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-0 text-xs",
                            getMediaTypeColor(item.type.slug),
                          )}
                        >
                          {item.type.name}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {otherItems.length > 0 && (
              <div>
                {inProgressItems.length > 0 && (
                  <h3 className="text-xl font-semibold mb-4">All Items</h3>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {otherItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/items/${item.id}`}
                      className="group block"
                    >
                      <div className="aspect-[2/3] bg-muted rounded-lg overflow-hidden mb-2 shadow-sm">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-full h-full object-fit"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                            {item.title}
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs">
                        <Badge
                          variant="outline"
                          className={cn(
                            "border-0 text-xs",
                            getMediaTypeColor(item.type.slug),
                          )}
                        >
                          {item.type.name}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
