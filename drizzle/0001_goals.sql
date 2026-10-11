CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"session_id" uuid NOT NULL,
	"name" text NOT NULL,
	"revenue_cents" integer,
	"path" text,
	"referrer" text,
	"utm_source" text,
	"utm_campaign" text,
	"country" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_site_created_idx" ON "events" USING btree ("site_id","created_at");