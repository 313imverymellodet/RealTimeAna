ALTER TABLE "usage" ADD COLUMN "weekly_summary" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "usage" ADD COLUMN "summary_sent_at" timestamp with time zone;