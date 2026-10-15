CREATE TABLE "social_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"site_id" uuid NOT NULL,
	"network" text NOT NULL,
	"handle" text NOT NULL,
	"remote_id" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"profile_url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "social_snapshots" (
	"account_id" uuid NOT NULL,
	"day" date NOT NULL,
	"followers" integer NOT NULL,
	"posts" integer NOT NULL,
	CONSTRAINT "social_snapshots_account_id_day_pk" PRIMARY KEY("account_id","day")
);
--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_snapshots" ADD CONSTRAINT "social_snapshots_account_id_social_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."social_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "social_accounts_site_handle_idx" ON "social_accounts" USING btree ("site_id","network","handle");