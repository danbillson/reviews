import { db } from "@/db/client";
import { mediaType } from "@/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const DEFAULT_TYPES = [
	{ name: "Books", slug: "books", providerKey: "openlibrary" },
	{ name: "Anime", slug: "anime", providerKey: "anilist-anime" },
	{ name: "Manga", slug: "manga", providerKey: "anilist-manga" },
	{ name: "Movies", slug: "movies", providerKey: "tmdb-movie" },
	{ name: "TV Shows", slug: "tv-shows", providerKey: "tmdb-tv" },
];

export async function seedDefaultTypesForUser(userId: string) {
	// Check if user already has any types
	const existingTypes = await db.query.mediaType.findFirst({
		where: eq(mediaType.userId, userId),
	});

	if (existingTypes) {
		return; // User already has types
	}

	// Create default types
	await db.insert(mediaType).values(
		DEFAULT_TYPES.map((t) => ({
			id: nanoid(),
			userId,
			name: t.name,
			slug: t.slug,
			providerKey: t.providerKey,
		})),
	);
}
