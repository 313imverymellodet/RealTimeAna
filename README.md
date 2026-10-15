# Housecount

Know who's in the house. Live web analytics without cookies: a 1.2 KB tracking script, an ingestion endpoint and a dashboard.

Next.js 16 (App Router) · Postgres with Drizzle · Better Auth · deployed on Railway.

## Local setup

```bash
pnpm install
cp .env.example .env.local     # set BETTER_AUTH_SECRET
pnpm db:local                  # in a second terminal: local Postgres-compatible database, no install needed
pnpm db:migrate
pnpm dev
```

`pnpm db:local` runs PGlite on port 5433 and keeps its data in `./.pglite`. Set `DATABASE_POOL_MAX=1`
with it, since it handles one connection at a time reliably. Any real Postgres works too;
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

Sites embed `public/tracker.js` with their site id. That file is generated: edit the readable
source in `tracker/tracker.js` and run `pnpm build:tracker` (the build does this too). It posts pageview and duration events to `/api/track`.

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

The tracker also answers to the former name (`pulse(...)`, `data-pulse-goal`) so earlier installs keep working.

**Goals and revenue.** Sites call `housecount("signup")` or `housecount("purchase", { revenue: 49 })`, or add
`data-housecount-goal="signup"` to an element. Each event copies the referrer and campaign of the visitor's
session, which is how revenue is attributed to a channel. Revenue is whatever the site's own code reports;
it is not verified against a payment provider.

**Signed-in users.** `housecount.identify("user_123")` links the day's visitor hash to a hash of the site's own
user id (`identities` table). Funnels and journeys group by that id when present, so they follow a person
across days and devices. Dashboard visitor totals still count daily uniques.

Statistics are aggregated in Postgres (`lib/stats.ts`); the browser only ever receives totals.

## Plans

Payments are not wired up. Every account is on the free beta plan defined in `lib/plans.ts`
(100,000 pageviews a month, 10 websites). Change the numbers there.

## Email

Password reset, address confirmation and a Monday weekly summary are sent through Resend once
`RESEND_API_KEY` and `EMAIL_FROM` are set. The summary job runs inside the server (`instrumentation.ts`),
checks hourly, and claims each account in the database so nobody is emailed twice. Without the keys,
messages are written to the server log and nothing is sent.

## Not built yet

- Paid plans and Stripe
- Automatic deletion of old page views

## Social accounts

Owners can connect a Bluesky or Mastodon account by handle (`lib/social.ts`). Both networks publish
profiles and posts openly, so no keys are needed. Follower counts are saved daily by the hourly job in
`instrumentation.ts`. Readers are credited to a post by its tracked link's campaign, or else to the
latest linking post in the previous 48 hours.

## Tests

```bash
pnpm test     # unit tests, the served tracker in a fake browser, and the full pipeline on in-memory Postgres
pnpm check    # types, lint and tests
pnpm build    # minifies the tracker, runs the tests, then builds; a failing test stops a deploy
```

The pipeline tests start PGlite in-process, apply the real migrations and call the real `/api/track`
handler, so they need no database or network.
