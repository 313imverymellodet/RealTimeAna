# Pulse

Live web analytics without cookies: a 1.3 KB tracking script, an ingestion endpoint and a dashboard.

Next.js 16 (App Router) · Postgres with Drizzle · Better Auth · deployed on Railway.

## Local setup

```bash
pnpm install
cp .env.example .env.local     # set BETTER_AUTH_SECRET
pnpm db:local                  # in a second terminal: local Postgres-compatible database, no install needed
pnpm db:migrate
pnpm dev
```

`pnpm db:local` runs PGlite on port 5433 and keeps its data in `./.pglite`. Any real Postgres works too;
point `DATABASE_URL` at it.

## Deploying to Railway

1. Create a project with two services: this repo and a Postgres database.
2. On the app service set:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `BETTER_AUTH_SECRET` = output of `openssl rand -base64 32`
   - `BETTER_AUTH_URL` and `NEXT_PUBLIC_SITE_URL` = your public URL, no trailing slash
3. Deploy. `pnpm start` applies pending migrations before the server starts, so the schema stays current.

## Database changes

Edit `lib/db/schema.ts`, then:

```bash
pnpm db:generate   # writes a new SQL file to ./drizzle
pnpm db:migrate    # applies it
```

Commit the generated SQL.

## How tracking works

Sites embed `public/tracker.js` with their site id. It posts pageview and duration events to `/api/track`.

- **No cookies or browser storage.** A visitor is a hash of site + IP + user agent with a random salt that is
  replaced and deleted every UTC day (`lib/visitor.ts`). IP addresses are never stored.
- **Sessions** are continued server-side when the same visitor returns within 30 minutes.
- **Origin check.** Events are accepted only from the site's registered domain or its subdomains.
- **Filtering.** Known bots are dropped; Do Not Track, Global Privacy Control and localhost are ignored by the script.
- **Location** comes from edge geo headers when present, otherwise the GeoLite database bundled with
  `geoip-lite`. That bundled data is dated; refresh it with a free MaxMind licence key
  (`npm run-script updatedb license_key=...` inside `node_modules/geoip-lite`) for better accuracy.
- **Rate limiting** in `lib/rate-limit.ts` is in memory and per instance: good enough for one Railway
  instance, replace with a shared store before scaling out.

Statistics are aggregated in Postgres (`lib/stats.ts`); the browser only ever receives totals.

## Plans

Payments are not wired up. Every account is on the free beta plan defined in `lib/plans.ts`
(100,000 pageviews a month, 10 websites). Change the numbers there.

## Not built yet

- Email: verification, password reset, weekly summaries
- Paid plans and Stripe
- Privacy policy and terms pages
- Automatic deletion of old page views

## Checks

```bash
pnpm typecheck
pnpm lint
pnpm build
```
