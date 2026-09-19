CREATE TABLE `task_assignments_history` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`from_user_id` text,
	`to_user_id` text NOT NULL,
	`reason` text NOT NULL,
	`changed_by` text NOT NULL,
	`changed_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`from_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`to_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`changed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `task_block_details` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`block_reason_code` text NOT NULL,
	`details` text NOT NULL,
	`waiting_for_user_id` text,
	`waiting_for_external_party` integer DEFAULT false NOT NULL,
	`started_at` text NOT NULL,
	`resolved_at` text,
	`resolved_by` text,
	`resolution_note` text,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`waiting_for_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`resolved_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `task_active_block_unique` ON `task_block_details` (`task_id`) WHERE "task_block_details"."resolved_at" is null;--> statement-breakpoint
CREATE TABLE `task_deadline_history` (
	`id` text PRIMARY KEY NOT NULL,
	`task_id` text NOT NULL,
	`old_due_at` text,
	`new_due_at` text,
	`reason` text NOT NULL,
	`changed_by` text NOT NULL,
	`changed_at` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`changed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`task_code` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`responsible_user_id` text NOT NULL,
	`project_id` text,
	`content_id` text,
	`event_id` text,
	`parent_task_id` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`acceptance_status` text DEFAULT 'not_requested' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`due_at` text,
	`unscheduled` integer DEFAULT true NOT NULL,
	`is_publication_required` integer DEFAULT false NOT NULL,
	`requires_review` integer DEFAULT false NOT NULL,
	`reviewer_user_id` text,
	`started_at` text,
	`completed_at` text,
	`completed_by` text,
	`withdrawn_at` text,
	`withdrawn_by` text,
	`created_at` text NOT NULL,
	`created_by` text NOT NULL,
	`updated_at` text NOT NULL,
	`updated_by` text NOT NULL,
	FOREIGN KEY (`responsible_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`reviewer_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`completed_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`withdrawn_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tasks_task_code_unique` ON `tasks` (`task_code`);