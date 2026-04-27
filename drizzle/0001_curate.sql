ALTER TABLE `case_studies` ADD `featured` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `case_studies` ADD `sort_order` integer DEFAULT 0 NOT NULL;