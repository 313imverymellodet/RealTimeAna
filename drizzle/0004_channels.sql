ALTER TABLE "events" ADD COLUMN "channel" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "network" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "channel" text;--> statement-breakpoint
ALTER TABLE "page_views" ADD COLUMN "network" text;--> statement-breakpoint
-- Classify rows recorded before channels existed
UPDATE "page_views" SET "network" = CASE
  WHEN referrer ~* '(^|\.)(x\.com|twitter\.com|t\.co)$' THEN 'X'
  WHEN referrer ~* '(^|\.)facebook\.com$' THEN 'Facebook'
  WHEN referrer ~* '(^|\.)instagram\.com$' THEN 'Instagram'
  WHEN referrer ~* '(^|\.)reddit\.com$' THEN 'Reddit'
  WHEN referrer ~* '(^|\.)(youtube\.com|youtu\.be)$' THEN 'YouTube'
  WHEN referrer ~* '(^|\.)tiktok\.com$' THEN 'TikTok'
  WHEN referrer ~* '(^|\.)bsky\.app$' THEN 'Bluesky'
  WHEN referrer ~* '(^|\.)(linkedin\.com|lnkd\.in)$' THEN 'LinkedIn'
  WHEN referrer ~* '(^|\.)threads\.net$' THEN 'Threads'
  WHEN referrer ~* '(^|\.)news\.ycombinator\.com$' THEN 'Hacker News'
  ELSE NULL END
WHERE "channel" IS NULL;--> statement-breakpoint
UPDATE "page_views" SET "channel" = CASE
  WHEN utm_medium ~* 'email|newsletter' THEN 'Newsletter'
  WHEN network IS NOT NULL THEN 'Social'
  WHEN referrer ~* '(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|yandex\.[a-z]+|baidu\.com|ecosia\.org|search\.brave\.com|kagi\.com)$' AND referrer !~* '^news\.' THEN 'Search'
  WHEN referrer IS NOT NULL THEN 'Referral'
  ELSE 'Direct' END
WHERE "channel" IS NULL;--> statement-breakpoint
-- Classify rows recorded before channels existed
UPDATE "events" SET "network" = CASE
  WHEN referrer ~* '(^|\.)(x\.com|twitter\.com|t\.co)$' THEN 'X'
  WHEN referrer ~* '(^|\.)facebook\.com$' THEN 'Facebook'
  WHEN referrer ~* '(^|\.)instagram\.com$' THEN 'Instagram'
  WHEN referrer ~* '(^|\.)reddit\.com$' THEN 'Reddit'
  WHEN referrer ~* '(^|\.)(youtube\.com|youtu\.be)$' THEN 'YouTube'
  WHEN referrer ~* '(^|\.)tiktok\.com$' THEN 'TikTok'
  WHEN referrer ~* '(^|\.)bsky\.app$' THEN 'Bluesky'
  WHEN referrer ~* '(^|\.)(linkedin\.com|lnkd\.in)$' THEN 'LinkedIn'
  WHEN referrer ~* '(^|\.)threads\.net$' THEN 'Threads'
  WHEN referrer ~* '(^|\.)news\.ycombinator\.com$' THEN 'Hacker News'
  ELSE NULL END
WHERE "channel" IS NULL;--> statement-breakpoint
UPDATE "events" SET "channel" = CASE
  WHEN network IS NOT NULL THEN 'Social'
  WHEN referrer ~* '(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|yandex\.[a-z]+|baidu\.com|ecosia\.org|search\.brave\.com|kagi\.com)$' AND referrer !~* '^news\.' THEN 'Search'
  WHEN referrer IS NOT NULL THEN 'Referral'
  ELSE 'Direct' END
WHERE "channel" IS NULL;
