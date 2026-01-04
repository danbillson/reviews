"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { mediaItem, mediaItemSource, mediaType } from "@/db/schema";
import { getProvider } from "@/lib/providers";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { nanoid } from "nanoid";

export async function importItem(formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		throw new Error("Unauthorized");
	}

	const typeId = formData.get("typeId") as string;
	const externalId = formData.get("externalId") as string;

	if (!typeId || !externalId) {
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

	// Create the item and source in a transaction
	const itemId = nanoid();
	const sourceId = nanoid();

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
	]);

	redirect(`/items/${itemId}`);
}

export async function createManualItem(formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		throw new Error("Unauthorized");
	}

	const typeId = formData.get("typeId") as string;
	const title = formData.get("title") as string;
	const subtitle = formData.get("subtitle") as string | null;
	const description = formData.get("description") as string | null;

	if (!typeId || !title) {
		throw new Error("Missing required fields");
	}

	// Verify the type belongs to the user
	const type = await db.query.mediaType.findFirst({
		where: and(eq(mediaType.id, typeId), eq(mediaType.userId, session.user.id)),
	});

	if (!type) {
		throw new Error("Invalid media type");
	}

	const itemId = nanoid();

	await db.insert(mediaItem).values({
		id: itemId,
		userId: session.user.id,
		typeId: type.id,
		title,
		subtitle: subtitle || undefined,
		description: description || undefined,
	});

	redirect(`/items/${itemId}`);
}
