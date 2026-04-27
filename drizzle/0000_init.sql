CREATE TABLE `blocks` (
	`id` text PRIMARY KEY NOT NULL,
	`case_study_id` text NOT NULL,
	`position` integer NOT NULL,
	`layout` text NOT NULL,
	`image_l_key` text NOT NULL,
	`image_r_key` text,
	`alt_l` text NOT NULL,
	`alt_r` text,
	FOREIGN KEY (`case_study_id`) REFERENCES `case_studies`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `blocks_case_idx` ON `blocks` (`case_study_id`,`position`);--> statement-breakpoint
CREATE TABLE `case_studies` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`summary` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`published_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `case_studies_slug_idx` ON `case_studies` (`slug`);--> statement-breakpoint
CREATE INDEX `case_studies_status_idx` ON `case_studies` (`status`);