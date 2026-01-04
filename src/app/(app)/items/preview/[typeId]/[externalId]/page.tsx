import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db/client";
import { mediaItemSource, mediaType } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getProvider } from "@/lib/providers";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Book01Icon,
  Film01Icon,
  Tv01Icon,
  MusicNote01Icon,
  GameIcon,
} from "@hugeicons/core-free-icons";
import { AddItemWithStatusForm } from "./add-item-form";

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

export default async function ItemPreviewPage({
  params,
}: {
  params: Promise<{ typeId: string; externalId: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const { typeId, externalId } = await params;

  // Get the media type
  const type = await db.query.mediaType.findFirst({
    where: and(eq(mediaType.id, typeId), eq(mediaType.userId, session.user.id)),
  });

  if (!type || !type.providerKey) {
    notFound();
  }

  // Check if we already have this item imported
  const existingSource = await db.query.mediaItemSource.findFirst({
    where: and(
      eq(mediaItemSource.userId, session.user.id),
      eq(mediaItemSource.providerKey, type.providerKey),
      eq(mediaItemSource.externalId, externalId),
    ),
  });

  if (existingSource) {
    redirect(`/items/${existingSource.itemId}`);
  }

  // Get details from provider
  const provider = getProvider(type.providerKey);
  if (!provider) {
    notFound();
  }

  const details = await provider.getDetails(
    externalId,
    type.providerConfig as Record<string, unknown> | undefined,
  );

  if (!details) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link
            href="/items/new"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Search
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Item Header */}
        <div className="flex gap-6 mb-8">
          {details.imageUrl && (
            <img
              src={details.imageUrl}
              alt=""
              className="w-32 sm:w-40 h-auto object-fit flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="secondary"
                className="text-xs"
                data-icon="inline-start"
              >
                <HugeiconsIcon
                  icon={
                    MEDIA_TYPE_ICONS[type.slug] || DEFAULT_MEDIA_ICON
                  }
                  strokeWidth={2}
                />
                {type.name}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
              {details.title}
            </h1>
            {details.subtitle && (
              <p className="text-lg text-muted-foreground mb-3">
                {details.subtitle}
              </p>
            )}
            {details.description && (
              <p className="text-sm text-muted-foreground line-clamp-4">
                {details.description}
              </p>
            )}
            <div className={details.description ? "mt-4" : "mt-3"}>
              <AddItemWithStatusForm
                typeId={typeId}
                externalId={externalId}
                providerKey={type.providerKey}
                providerConfig={type.providerConfig as Record<string, unknown> | undefined}
                mediaTypeSlug={type.slug}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
