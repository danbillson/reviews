"use server";

import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { EntryStatus } from "@/db/app-schema";
import { db } from "@/db/client";
import { entry, mediaItem, mediaItemSource, mediaType } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getProvider } from "@/lib/providers";

export async function importItemWithStatus(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const typeId = formData.get("typeId") as string;
  const externalId = formData.get("externalId") as string;
  const status = formData.get("status") as EntryStatus;

  if (!typeId || !externalId || !status) {
    throw new Error("Missing required fields");
  }

  // Get the media type
  const type = await db.query.mediaType.findFirst({
    where: and(eq(mediaType.id, typeId), eq(mediaType.userId, session.user.id)),
  });

  if (!type || !type.providerKey) {
    throw new Error("Invalid media type");
  }

  const provider = getProvider(type.providerKey);
  if (!provider) {
    throw new Error("Provider not found");
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
    // If item exists but no entry, create one
    const existingEntry = await db.query.entry.findFirst({
      where: and(
        eq(entry.itemId, existingSource.itemId),
        eq(entry.userId, session.user.id),
      ),
    });

    if (!existingEntry) {
      const now = new Date();
      const entryId = nanoid();

      await db.insert(entry).values({
        id: entryId,
        userId: session.user.id,
        itemId: existingSource.itemId,
        status,
        startedAt: status === "started" ? now : undefined,
        finishedAt: status === "finished" ? now : undefined,
        droppedAt: status === "dropped" ? now : undefined,
      });
    }

    redirect(`/items/${existingSource.itemId}`);
  }

  // Get details from provider
  const details = await provider.getDetails(
    externalId,
    type.providerConfig as Record<string, unknown> | undefined,
  );

  if (!details) {
    throw new Error("Failed to get item details from provider");
  }

  // Create the item, source, and entry in a transaction
  const itemId = nanoid();
  const sourceId = nanoid();
  const entryId = nanoid();
  const now = new Date();

  await db.batch([
    db.insert(mediaItem).values({
      id: itemId,
      userId: session.user.id,
      typeId: type.id,
      title: details.title,
      subtitle: details.subtitle,
      description: details.description,
      imageUrl: details.imageUrl,
      metadata: details.metadata,
    }),
    db.insert(mediaItemSource).values({
      id: sourceId,
      userId: session.user.id,
      itemId: itemId,
      providerKey: type.providerKey,
      externalId: details.externalId,
      rawData: details.metadata,
    }),
    db.insert(entry).values({
      id: entryId,
      userId: session.user.id,
      itemId: itemId,
      status,
      startedAt: status === "started" ? now : undefined,
      finishedAt: status === "finished" ? now : undefined,
      droppedAt: status === "dropped" ? now : undefined,
    }),
  ]);

  redirect(`/items/${itemId}`);
}
