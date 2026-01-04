"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { entry, note, mediaSegment, mediaItem } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import type { EntryStatus } from "@/db/app-schema";

export async function createEntry(formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		throw new Error("Unauthorized");
	}

	const itemId = formData.get("itemId") as string;
	const status = formData.get("status") as EntryStatus;

	if (!itemId || !status) {
		throw new Error("Missing required fields");
	}

	// Verify item belongs to user
	const item = await db.query.mediaItem.findFirst({
		where: and(eq(mediaItem.id, itemId), eq(mediaItem.userId, session.user.id)),
	});

	if (!item) {
		throw new Error("Item not found");
	}

	const now = new Date();
	const entryId = nanoid();

	await db.insert(entry).values({
		id: entryId,
		userId: session.user.id,
		itemId,
		status,
		startedAt: status === "started" ? now : undefined,
		finishedAt: status === "finished" ? now : undefined,
		droppedAt: status === "dropped" ? now : undefined,
	});

	revalidatePath(`/items/${itemId}`);
}

export async function updateEntry(formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		throw new Error("Unauthorized");
	}

	const entryId = formData.get("entryId") as string;
	const itemId = formData.get("itemId") as string;
	const status = formData.get("status") as EntryStatus | null;
	const recommendStr = formData.get("recommend") as string | null;
	const scoreStr = formData.get("score") as string | null;

	if (!entryId) {
		throw new Error("Missing entry ID");
	}

	// Verify entry belongs to user
	const existingEntry = await db.query.entry.findFirst({
		where: and(eq(entry.id, entryId), eq(entry.userId, session.user.id)),
	});

	if (!existingEntry) {
		throw new Error("Entry not found");
	}

	const now = new Date();
	const updates: Partial<typeof entry.$inferInsert> = {};

	if (status && status !== existingEntry.status) {
		updates.status = status;
		if (status === "started" && !existingEntry.startedAt) {
			updates.startedAt = now;
		} else if (status === "finished") {
			updates.finishedAt = now;
		} else if (status === "dropped") {
			updates.droppedAt = now;
		}
	}

	if (recommendStr !== null) {
		updates.recommend = recommendStr === "" ? null : recommendStr === "true";
	}

	if (scoreStr !== null) {
		const score = scoreStr === "" ? null : Number.parseInt(scoreStr, 10);
		updates.score = Number.isNaN(score) ? null : score;
	}

	if (Object.keys(updates).length > 0) {
		await db.update(entry).set(updates).where(eq(entry.id, entryId));
	}

	revalidatePath(`/items/${itemId}`);
}

export async function deleteEntry(formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		throw new Error("Unauthorized");
	}

	const entryId = formData.get("entryId") as string;
	const itemId = formData.get("itemId") as string;

	if (!entryId) {
		throw new Error("Missing entry ID");
	}

	await db.delete(entry).where(
		and(eq(entry.id, entryId), eq(entry.userId, session.user.id)),
	);

	revalidatePath(`/items/${itemId}`);
}

export async function createNote(formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		throw new Error("Unauthorized");
	}

	const itemId = formData.get("itemId") as string;
	const entryId = formData.get("entryId") as string | null;
	const segmentId = formData.get("segmentId") as string | null;
	const body = formData.get("body") as string;

	if (!itemId || !body?.trim()) {
		throw new Error("Missing required fields");
	}

	// Verify item belongs to user
	const item = await db.query.mediaItem.findFirst({
		where: and(eq(mediaItem.id, itemId), eq(mediaItem.userId, session.user.id)),
	});

	if (!item) {
		throw new Error("Item not found");
	}

	await db.insert(note).values({
		id: nanoid(),
		userId: session.user.id,
		itemId,
		entryId: entryId || undefined,
		segmentId: segmentId || undefined,
		body: body.trim(),
	});

	revalidatePath(`/items/${itemId}`);
}

export async function createSegment(formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		throw new Error("Unauthorized");
	}

	const itemId = formData.get("itemId") as string;
	const title = formData.get("title") as string;

	if (!itemId || !title?.trim()) {
		throw new Error("Missing required fields");
	}

	// Verify item belongs to user
	const item = await db.query.mediaItem.findFirst({
		where: and(eq(mediaItem.id, itemId), eq(mediaItem.userId, session.user.id)),
	});

	if (!item) {
		throw new Error("Item not found");
	}

	// Get the next order index
	const existingSegments = await db.query.mediaSegment.findMany({
		where: eq(mediaSegment.itemId, itemId),
		orderBy: (s, { desc }) => [desc(s.orderIndex)],
		limit: 1,
	});

	const nextIndex = (existingSegments[0]?.orderIndex ?? -1) + 1;

	await db.insert(mediaSegment).values({
		id: nanoid(),
		itemId,
		orderIndex: nextIndex,
		title: title.trim(),
	});

	revalidatePath(`/items/${itemId}`);
}

export async function deleteItem(formData: FormData) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session) {
		throw new Error("Unauthorized");
	}

	const itemId = formData.get("itemId") as string;

	if (!itemId) {
		throw new Error("Missing item ID");
	}

	await db.delete(mediaItem).where(
		and(eq(mediaItem.id, itemId), eq(mediaItem.userId, session.user.id)),
	);

	// Redirect happens on client side
}
