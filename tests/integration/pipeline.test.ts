// End-to-end tests of the tracking pipeline: real route handler, real SQL,
// against an in-memory Postgres (PGlite) served over the normal wire protocol.

import { randomUUID } from "node:crypto"
import { PGlite } from "@electric-sql/pglite"
import { PGLiteSocketServer } from "@electric-sql/pglite-socket"
import { NextRequest } from "next/server"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"

const PORT = 55_000 + Math.floor(Math.random() * 5_000)
const CHROME = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36"

let server: PGLiteSocketServer
let modules: {
  db: typeof import("@/lib/db")
  track: typeof import("@/app/api/track/route")
  stats: typeof import("@/lib/stats")
  funnels: typeof import("@/lib/funnels")
  journeys: typeof import("@/lib/journeys")
  social: typeof import("@/lib/social")
}

beforeAll(async () => {
  const pglite = await PGlite.create()
  server = new PGLiteSocketServer({ db: pglite, port: PORT, maxConnections: 20 })
  await server.start()
  process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${PORT}/postgres`
  // PGlite runs one query at a time; a single connection avoids dropped sockets
  process.env.DATABASE_POOL_MAX = "1"

  const { drizzle } = await import("drizzle-orm/node-postgres")
  const { migrate } = await import("drizzle-orm/node-postgres/migrator")
  const { Pool } = await import("pg")
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 })
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" })
  await pool.end()

  modules = {
    db: await import("@/lib/db"),
    track: await import("@/app/api/track/route"),
    stats: await import("@/lib/stats"),
    funnels: await import("@/lib/funnels"),
    journeys: await import("@/lib/journeys"),
    social: await import("@/lib/social"),
  }
})

afterAll(async () => {
  await (globalThis as { pgPool?: { end: () => Promise<void> } }).pgPool?.end()
  await server?.stop()
})

// A fresh owner and site, so each test reads only its own data
async function newSite(domain = `site-${randomUUID().slice(0, 8)}.example`) {
  const { getDb, schema } = modules.db
  const userId = randomUUID()
  await getDb().insert(schema.user).values({ id: userId, name: "Owner", email: `${userId}@example.test` })
  const [site] = await getDb().insert(schema.sites).values({ userId, name: domain, domain }).returning()
  return site
}

interface Visit {
  ip: string
  origin?: string
  ua?: string
}

async function send(body: Record<string, unknown>, visit: Visit) {
  const request = new NextRequest("http://localhost/api/track", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "content-type": "text/plain",
      "user-agent": visit.ua ?? CHROME,
      "x-forwarded-for": visit.ip,
      ...(visit.origin !== undefined ? { origin: visit.origin } : {}),
    },
  })
  const response = await modules.track.POST(request)
  return { status: response.status, body: await response.json() }
}

function tracker(site: { id: string; domain: string }) {
  const origin = `https://${site.domain}`
  const ok = async (body: Record<string, unknown>, ip: string) => {
    const result = await send(body, { ip, origin })
    expect(result, JSON.stringify(body)).toMatchObject({ status: 200, body: { success: true } })
    return result
  }
  return {
    view: async (ip: string, path: string, extra: Record<string, unknown> = {}) => {
      const id = randomUUID()
      await ok({ type: "pageview", siteId: site.id, id, path, ...extra }, ip)
      return { id }
    },
    leave: (ip: string, id: string, path: string, duration: number, depth?: number) =>
      ok({ type: "duration", siteId: site.id, id, path, duration, depth }, ip),
    goal: (ip: string, name: string, revenue?: number) =>
      ok({ type: "event", siteId: site.id, name, path: "/", revenue }, ip),
    identify: (ip: string, userId: string) => ok({ type: "identify", siteId: site.id, userId, path: "/" }, ip),
  }
}

const stats = (siteId: string) => modules.stats.getStats(siteId, "today", "UTC")

describe("what the endpoint accepts", () => {
  it("rejects bad payloads, unknown sites, other origins and bots", async () => {
    const site = await newSite()
    const id = randomUUID()
    const view = { type: "pageview", siteId: site.id, id, path: "/" }

    expect((await send({ type: "pageview" }, { ip: "1.1.1.1", origin: `https://${site.domain}` })).status).toBe(400)
    expect((await send({ ...view, siteId: randomUUID() }, { ip: "1.1.1.1", origin: `https://${site.domain}` })).status).toBe(404)
    expect((await send(view, { ip: "1.1.1.1", origin: "https://evil.example" })).status).toBe(403)
    expect((await send(view, { ip: "1.1.1.1" })).status).toBe(403)
    expect((await send(view, { ip: "1.1.1.1", origin: `https://${site.domain}`, ua: "Googlebot/2.1" })).status).toBe(202)
    // Subdomains of the registered site are allowed
    expect((await send(view, { ip: "1.1.1.1", origin: `https://blog.${site.domain}` })).status).toBe(200)

    expect((await stats(site.id)).totals.pageviews).toBe(1)
  })
})

describe("visits and sessions", () => {
  it("joins one visitor's pages into a session and counts bounces", async () => {
    const site = await newSite()
    const t = tracker(site)
    await t.view("2.2.2.2", "/")
    await t.view("2.2.2.2", "/story")
    await t.view("3.3.3.3", "/")

    const { totals } = await stats(site.id)
    expect(totals).toMatchObject({ visitors: 2, pageviews: 3, sessions: 2, bounceRate: 50 })
  })

  it("keeps the furthest read depth and averages time on page", async () => {
    const site = await newSite()
    const t = tracker(site)
    const a = await t.view("4.4.4.4", "/long-read")
    await t.leave("4.4.4.4", a.id, "/long-read", 40, 70)
    // A later report with less depth (scrolled back up) must not lower it
    await t.leave("4.4.4.4", a.id, "/long-read", 90, 30)
    const b = await t.view("5.5.5.5", "/long-read")
    await t.leave("5.5.5.5", b.id, "/long-read", 210, 100)

    const story = (await stats(site.id)).stories.find((s) => s.path === "/long-read")
    expect(story).toMatchObject({ readers: 2, views: 2, avgSeconds: 150, depth: 85, finished: 50 })
  })

  it("counts every pageview against the owner's monthly usage", async () => {
    const site = await newSite()
    const t = tracker(site)
    await t.view("6.6.6.6", "/")
    await t.view("6.6.6.6", "/a")
    await t.view("7.7.7.7", "/")

    const { getDb, schema } = modules.db
    const { eq } = await import("drizzle-orm")
    const [usage] = await getDb().select().from(schema.usage).where(eq(schema.usage.userId, site.userId))
    expect(usage.pageviews).toBe(3)
  })
})

describe("sources", () => {
  it("classifies arrivals and keeps the source for the rest of the session", async () => {
    const site = await newSite()
    const t = tracker(site)
    await t.view("8.8.8.1", "/story", { referrer: "https://t.co/abc" })
    await t.view("8.8.8.1", "/membership")
    await t.view("8.8.8.2", "/", { referrer: "https://www.google.com/" })
    await t.view("8.8.8.3", "/", { utmSource: "bluesky", utmMedium: "social", utmCampaign: "thread-1" })
    await t.view("8.8.8.4", "/", { utmSource: "newsletter", utmMedium: "email" })
    await t.view("8.8.8.5", "/")
    // A visit from the site's own pages is not a referral
    await t.view("8.8.8.6", "/", { referrer: `https://${site.domain}/other` })

    const s = await stats(site.id)
    const channels = Object.fromEntries(s.channels.map((row) => [row.label, row.pageviews]))
    expect(channels).toEqual({ Social: 3, Search: 1, Newsletter: 1, Direct: 2 })
    expect(s.networks.map((row) => row.label).sort()).toEqual(["Bluesky", "X"])
    expect(s.campaigns.map((row) => row.label)).toEqual(["thread-1"])
  })

  it("credits goals and revenue to the channel that started the visit", async () => {
    const site = await newSite()
    const t = tracker(site)
    await t.view("9.9.9.1", "/story", { referrer: "https://x.com/post" })
    await t.goal("9.9.9.1", "Membership", 8)
    await t.view("9.9.9.2", "/")
    await t.goal("9.9.9.2", "newsletter signup")

    const s = await stats(site.id)
    expect(s.totals).toMatchObject({ conversions: 2, conversionRate: 100, revenueCents: 800 })
    expect(s.goals.find((goal) => goal.name === "membership")).toMatchObject({ completions: 1, revenueCents: 800 })
    expect(s.networks.find((row) => row.label === "X")?.revenueCents).toBe(800)
    expect(s.channels.find((row) => row.label === "Direct")?.revenueCents).toBe(0)
  })
})

describe("funnels and journeys", () => {
  it("only counts steps done in order", async () => {
    const site = await newSite()
    const t = tracker(site)
    await t.view("10.0.0.1", "/")
    await t.view("10.0.0.1", "/pricing")
    await t.goal("10.0.0.1", "signup")
    await t.view("10.0.0.2", "/pricing")
    await t.view("10.0.0.2", "/") // wrong order

    const { getDb, schema } = modules.db
    await getDb()
      .insert(schema.funnels)
      .values({ siteId: site.id, name: "Home to signup", steps: [
        { type: "page", value: "/" },
        { type: "page", value: "/pricing" },
        { type: "goal", value: "signup" },
      ] })

    const [funnel] = await modules.funnels.getFunnelResults(site.id, "today", "UTC")
    expect(funnel.steps.map((step) => step.visitors)).toEqual([2, 1, 1])
  })

  it("follows an identified member across separate visits, and only them", async () => {
    const site = await newSite()
    const t = tracker(site)
    // Same person on two devices (two different anonymous visitor hashes)
    await t.view("11.0.0.1", "/")
    await t.goal("11.0.0.1", "newsletter signup")
    await t.identify("11.0.0.1", "member_42")
    await t.identify("11.0.0.2", "member_42")
    await t.view("11.0.0.2", "/membership")
    await t.goal("11.0.0.2", "membership", 8)
    // Two strangers doing the same split
    await t.view("11.0.0.3", "/")
    await t.goal("11.0.0.3", "newsletter signup")
    await t.view("11.0.0.4", "/membership")
    await t.goal("11.0.0.4", "membership", 8)

    const { getDb, schema } = modules.db
    await getDb().insert(schema.funnels).values({ siteId: site.id, name: "Story to member", steps: [
      { type: "page", value: "/" },
      { type: "goal", value: "newsletter signup" },
      { type: "goal", value: "membership" },
    ] })
    const [funnel] = await modules.funnels.getFunnelResults(site.id, "today", "UTC")
    expect(funnel.steps.map((step) => step.visitors)).toEqual([2, 2, 1])

    const people = await modules.journeys.listVisitors(site.id, "today", "UTC")
    const member = people.find((person) => person.identified)!
    expect(people).toHaveLength(3)
    expect(member).toMatchObject({ pageviews: 2, goals: 2, revenueCents: 800 })

    const journey = await modules.journeys.getJourney(site.id, member.id)
    expect(journey.map((step) => step.label)).toEqual(["/", "newsletter signup", "/membership", "membership"])

    // The raw member id is never stored
    const raw = await getDb().select().from(schema.identities)
    expect(JSON.stringify(raw)).not.toContain("member_42")
  })
})

describe("live view", () => {
  it("seats everyone on the site, lists arrivals and ranks stories", async () => {
    const site = await newSite()
    const t = tracker(site)
    await t.view("12.0.0.1", "/big-story", { referrer: "https://www.google.com/" })
    await t.view("12.0.0.2", "/big-story", { referrer: "https://bsky.app/profile/x" })
    await t.view("12.0.0.3", "/big-story")
    await t.view("12.0.0.4", "/")

    const live = await modules.stats.getRealtime(site.id)
    expect(live.visitors).toBe(4)
    expect(live.seats.map((seat) => seat.channel).sort()).toEqual(["Direct", "Direct", "Search", "Social"])
    expect(live.arrivals).toHaveLength(4)
    expect(live.trending[0]).toMatchObject({ path: "/big-story", now: 3, recent: 3 })
    expect(live.trending[0].spark[9]).toBe(3)
  })
})

describe("social accounts", () => {
  it("credits readers to the post that linked to the site", async () => {
    const site = await newSite("social-test.example")
    const t = tracker(site)
    const posted = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    // Stand in for the Bluesky public API
    const realFetch = globalThis.fetch
    vi.stubGlobal("fetch", async (url: string | URL) => {
      const href = String(url)
      if (href.includes("getProfile")) {
        return Response.json({ did: "did:plc:test", handle: "paper.bsky.social", displayName: "Paper", followersCount: 120, postsCount: 9 })
      }
      if (href.includes("getAuthorFeed")) {
        return Response.json({
          feed: [
            {
              post: {
                uri: "at://did:plc:test/app.bsky.feed.post/linked",
                author: { did: "did:plc:test", handle: "paper.bsky.social" },
                record: { text: "Read our story", createdAt: posted },
                embed: { external: { uri: "https://social-test.example/story" } },
                likeCount: 10,
                repostCount: 2,
                replyCount: 1,
              },
            },
            {
              post: {
                uri: "at://did:plc:test/app.bsky.feed.post/plain",
                author: { did: "did:plc:test", handle: "paper.bsky.social" },
                record: { text: "No link here", createdAt: posted },
                likeCount: 3,
              },
            },
          ],
        })
      }
      return realFetch(url)
    })

    try {
      const connected = await modules.social.connectAccount(site.id, "bluesky", "@paper.bsky.social")
      expect("account" in connected).toBe(true)
      expect((await modules.social.connectAccount(site.id, "bluesky", "paper.bsky.social")).error).toMatch(/already/)

      await t.view("13.0.0.1", "/story", { referrer: "https://bsky.app/" })
      await t.view("13.0.0.2", "/story", { referrer: "https://go.bsky.app/" })
      await t.view("13.0.0.3", "/story", { referrer: "https://www.google.com/" })

      const [account] = await modules.social.getSocialOverview(site)
      expect(account).toMatchObject({ followers: 120, readersThisWeek: 2, stale: false })
      const linked = account.recentPosts.find((post) => post.id === "linked")!
      const plain = account.recentPosts.find((post) => post.id === "plain")!
      expect(linked).toMatchObject({ linksToSite: true, readers: 2, likes: 10 })
      expect(plain).toMatchObject({ linksToSite: false, readers: null })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
