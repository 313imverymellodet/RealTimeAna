import { relations, sql } from "drizzle-orm"
import {
  boolean,
  date,
  primaryKey,
  jsonb,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

// ---------------------------------------------------------------------------
// Auth tables (shape required by Better Auth)
// ---------------------------------------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId)],
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
)

// ---------------------------------------------------------------------------
// App tables
// ---------------------------------------------------------------------------

// Plan and monthly pageview count per account. Written by the server only.
export const usage = pgTable("usage", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("beta"),
  pageviews: integer("pageviews").notNull().default(0),
  periodStart: timestamp("period_start", { withTimezone: true }).notNull().defaultNow(),
  // Weekly summary email: opt-out flag and when the last one went out
  weeklySummary: boolean("weekly_summary").notNull().default(true),
  summarySentAt: timestamp("summary_sent_at", { withTimezone: true }),
})

export const sites = pgTable(
  "sites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    domain: text("domain").notNull(),
    // Set when the owner turns on the public, read-only dashboard link
    publicToken: text("public_token").unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sites_user_domain_idx").on(t.userId, t.domain)],
)

export const pageViews = pgTable(
  "page_views",
  {
    // Generated in the visitor's browser per page load (kept in memory only)
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    // Daily-rotating hash; cannot be linked across days or sites
    visitorId: text("visitor_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    path: text("path").notNull(),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    // Search, Social, Newsletter, ... and the social network, set when the session starts
    channel: text("channel"),
    network: text("network"),
    country: text("country"),
    region: text("region"),
    city: text("city"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    device: text("device"),
    browser: text("browser"),
    os: text("os"),
    duration: integer("duration").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("page_views_site_created_idx").on(t.siteId, t.createdAt),
    index("page_views_site_visitor_idx").on(t.siteId, t.visitorId, t.createdAt),
  ],
)

// Goals: named actions a site reports (signup, purchase, ...), optionally with revenue.
// Source columns are copied from the visitor's session so conversions can be
// attributed to the channel that brought them.
export const events = pgTable(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    sessionId: uuid("session_id").notNull(),
    name: text("name").notNull(),
    // Amount in cents, as reported by the site's own code
    revenueCents: integer("revenue_cents"),
    path: text("path"),
    referrer: text("referrer"),
    utmSource: text("utm_source"),
    utmCampaign: text("utm_campaign"),
    channel: text("channel"),
    network: text("network"),
    country: text("country"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_site_created_idx").on(t.siteId, t.createdAt)],
)

// Links a daily visitor hash to a signed-in user the site identified, so funnels
// and journeys can follow that person across days and devices. `userId` is a
// one-way hash of the id the site passed; the id itself is never stored.
export const identities = pgTable(
  "identities",
  {
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    visitorId: text("visitor_id").notNull(),
    userId: text("user_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.siteId, t.visitorId] }), index("identities_site_user_idx").on(t.siteId, t.userId)],
)

export interface FunnelStep {
  // "page" matches a path (a trailing * matches anything after it); "goal" matches a goal name
  type: "page" | "goal"
  value: string
}

export const funnels = pgTable(
  "funnels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    siteId: uuid("site_id")
      .notNull()
      .references(() => sites.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    steps: jsonb("steps").$type<FunnelStep[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("funnels_site_idx").on(t.siteId)],
)

// One random salt per UTC day for visitor hashing. Old rows are deleted, which
// makes earlier visitor hashes impossible to recompute.
export const salts = pgTable("salts", {
  day: date("day").primaryKey().default(sql`CURRENT_DATE`),
  salt: text("salt").notNull(),
})

export const sitesRelations = relations(sites, ({ one }) => ({
  owner: one(user, { fields: [sites.userId], references: [user.id] }),
}))
