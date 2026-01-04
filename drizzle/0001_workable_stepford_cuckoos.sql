CREATE TABLE `entry` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`started_at` integer,
	`finished_at` integer,
	`dropped_at` integer,
	`recommend` integer,
	`score` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `media_item`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `entry_userId_idx` ON `entry` (`user_id`);--> statement-breakpoint
CREATE INDEX `entry_itemId_idx` ON `entry` (`item_id`);--> statement-breakpoint
CREATE INDEX `entry_status_idx` ON `entry` (`status`);--> statement-breakpoint
CREATE TABLE `media_item` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type_id` text NOT NULL,
	`title` text NOT NULL,
	`subtitle` text,
	`description` text,
	`image_url` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`type_id`) REFERENCES `media_type`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_item_userId_idx` ON `media_item` (`user_id`);--> statement-breakpoint
CREATE INDEX `media_item_typeId_idx` ON `media_item` (`type_id`);--> statement-breakpoint
CREATE TABLE `media_item_source` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`provider_key` text NOT NULL,
	`external_id` text NOT NULL,
	`raw_data` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `media_item`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_item_source_itemId_idx` ON `media_item_source` (`item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `media_item_source_unique_idx` ON `media_item_source` (`user_id`,`provider_key`,`external_id`);--> statement-breakpoint
CREATE TABLE `media_segment` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`order_index` integer NOT NULL,
	`title` text,
	`metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `media_item`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_segment_itemId_idx` ON `media_segment` (`item_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `media_segment_item_order_idx` ON `media_segment` (`item_id`,`order_index`);--> statement-breakpoint
CREATE TABLE `media_type` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`provider_key` text,
	`provider_config` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `media_type_userId_idx` ON `media_type` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `media_type_userId_slug_idx` ON `media_type` (`user_id`,`slug`);--> statement-breakpoint
CREATE TABLE `note` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`entry_id` text,
	`segment_id` text,
	`body` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `media_item`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`entry_id`) REFERENCES `entry`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`segment_id`) REFERENCES `media_segment`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `note_userId_idx` ON `note` (`user_id`);--> statement-breakpoint
CREATE INDEX `note_itemId_idx` ON `note` (`item_id`);--> statement-breakpoint
CREATE INDEX `note_entryId_idx` ON `note` (`entry_id`);--> statement-breakpoint
CREATE INDEX `note_segmentId_idx` ON `note` (`segment_id`);