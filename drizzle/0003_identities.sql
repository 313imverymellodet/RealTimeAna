CREATE TABLE "identities" (
	"site_id" uuid NOT NULL,
	"visitor_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identities_site_id_visitor_id_pk" PRIMARY KEY("site_id","visitor_id")
);
--> statement-breakpoint
ALTER TABLE "identities" ADD CONSTRAINT "identities_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "identities_site_user_idx" ON "identities" USING btree ("site_id","user_id");