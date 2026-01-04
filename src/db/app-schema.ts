import { relations, sql } from "drizzle-orm";
import {
	sqliteTable,
	text,
	integer,
	index,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

// Media Types - extensible categories for different kinds of media
export const mediaType = sqliteTable(
	"media_type",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
		slug: text("slug").notNull(),
		providerKey: text("provider_key"), // e.g., "openlibrary", "anilist", "tmdb"
		providerConfig: text("provider_config", { mode: "json" }).$type<Record<string, unknown>>(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("media_type_userId_idx").on(table.userId),
		uniqueIndex("media_type_userId_slug_idx").on(table.userId, table.slug),
	],
);

// Media Items - the actual media (book, movie, anime, etc.)
export const mediaItem = sqliteTable(
	"media_item",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		typeId: text("type_id")
			.notNull()
			.references(() => mediaType.id, { onDelete: "cascade" }),
		title: text("title").notNull(),
		subtitle: text("subtitle"),
		description: text("description"),
		imageUrl: text("image_url"),
		metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("media_item_userId_idx").on(table.userId),
		index("media_item_typeId_idx").on(table.typeId),
	],
);

// Media Item Sources - links to external providers (for deduplication on import)
export const mediaItemSource = sqliteTable(
	"media_item_source",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		itemId: text("item_id")
			.notNull()
			.references(() => mediaItem.id, { onDelete: "cascade" }),
		providerKey: text("provider_key").notNull(),
		externalId: text("external_id").notNull(),
		rawData: text("raw_data", { mode: "json" }).$type<Record<string, unknown>>(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("media_item_source_itemId_idx").on(table.itemId),
		uniqueIndex("media_item_source_unique_idx").on(
			table.userId,
			table.providerKey,
			table.externalId,
		),
	],
);

// Entry status enum values
export type EntryStatus = "planned" | "started" | "finished" | "dropped";

// Entries - user's interaction with a media item
export const entry = sqliteTable(
	"entry",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		itemId: text("item_id")
			.notNull()
			.references(() => mediaItem.id, { onDelete: "cascade" }),
		status: text("status").$type<EntryStatus>().notNull().default("planned"),
		startedAt: integer("started_at", { mode: "timestamp_ms" }),
		finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
		droppedAt: integer("dropped_at", { mode: "timestamp_ms" }),
		recommend: integer("recommend", { mode: "boolean" }),
		score: integer("score"), // 0-100 scale
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.$onUpdate(() => new Date())
			.notNull(),
	},
	(table) => [
		index("entry_userId_idx").on(table.userId),
		index("entry_itemId_idx").on(table.itemId),
		index("entry_status_idx").on(table.status),
	],
);

// Media Segments - parts of a media item (chapters, episodes, etc.)
export const mediaSegment = sqliteTable(
	"media_segment",
	{
		id: text("id").primaryKey(),
		itemId: text("item_id")
			.notNull()
			.references(() => mediaItem.id, { onDelete: "cascade" }),
		orderIndex: integer("order_index").notNull(),
		title: text("title"),
		metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("media_segment_itemId_idx").on(table.itemId),
		uniqueIndex("media_segment_item_order_idx").on(table.itemId, table.orderIndex),
	],
);

// Notes - reflections attached to items with optional tags
export const note = sqliteTable(
	"note",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		itemId: text("item_id")
			.notNull()
			.references(() => mediaItem.id, { onDelete: "cascade" }),
		entryId: text("entry_id").references(() => entry.id, { onDelete: "set null" }),
		segmentId: text("segment_id").references(() => mediaSegment.id, {
			onDelete: "set null",
		}),
		tag: text("tag"), // Optional tag like "chapter one", "episode 5", etc.
		body: text("body").notNull(),
		createdAt: integer("created_at", { mode: "timestamp_ms" })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull(),
	},
	(table) => [
		index("note_userId_idx").on(table.userId),
		index("note_itemId_idx").on(table.itemId),
		index("note_entryId_idx").on(table.entryId),
		index("note_segmentId_idx").on(table.segmentId),
	],
);

// Relations
export const mediaTypeRelations = relations(mediaType, ({ one, many }) => ({
	user: one(user, {
		fields: [mediaType.userId],
		references: [user.id],
	}),
	items: many(mediaItem),
}));

export const mediaItemRelations = relations(mediaItem, ({ one, many }) => ({
	user: one(user, {
		fields: [mediaItem.userId],
		references: [user.id],
	}),
	type: one(mediaType, {
		fields: [mediaItem.typeId],
		references: [mediaType.id],
	}),
	sources: many(mediaItemSource),
	entries: many(entry),
	segments: many(mediaSegment),
	notes: many(note),
}));

export const mediaItemSourceRelations = relations(mediaItemSource, ({ one }) => ({
	user: one(user, {
		fields: [mediaItemSource.userId],
		references: [user.id],
	}),
	item: one(mediaItem, {
		fields: [mediaItemSource.itemId],
		references: [mediaItem.id],
	}),
}));

export const entryRelations = relations(entry, ({ one, many }) => ({
	user: one(user, {
		fields: [entry.userId],
		references: [user.id],
	}),
	item: one(mediaItem, {
		fields: [entry.itemId],
		references: [mediaItem.id],
	}),
	notes: many(note),
}));

export const mediaSegmentRelations = relations(mediaSegment, ({ one, many }) => ({
	item: one(mediaItem, {
		fields: [mediaSegment.itemId],
		references: [mediaItem.id],
	}),
	notes: many(note),
}));

export const noteRelations = relations(note, ({ one }) => ({
	user: one(user, {
		fields: [note.userId],
		references: [user.id],
	}),
	item: one(mediaItem, {
		fields: [note.itemId],
		references: [mediaItem.id],
	}),
	entry: one(entry, {
		fields: [note.entryId],
		references: [entry.id],
	}),
	segment: one(mediaSegment, {
		fields: [note.segmentId],
		references: [mediaSegment.id],
	}),
}));
