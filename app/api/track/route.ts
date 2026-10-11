import { randomUUID } from "node:crypto"
import { and, desc, eq, gte, sql } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { getDb, schema } from "@/lib/db"
import { getClientIp, lookupGeo } from "@/lib/geo"
import { getPlan } from "@/lib/plans"
import { isRateLimited } from "@/lib/rate-limit"
import { isUuid, normalizeDomain } from "@/lib/sites"
import { getVisitorId, isBot, parseUserAgent } from "@/lib/visitor"

const MAX_URL_LENGTH = 2048
const MAX_EVENTS_PER_MINUTE = 120
const SESSION_WINDOW_MS = 30 * 60 * 1000

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: CORS_HEADERS })
}

// Only accept events sent by a browser from the tracked site (or a subdomain of it)
function originMatchesSite(origin: string | null, siteDomain: string) {
  if (!origin) return false
  let originHost: string
  try {
    originHost = normalizeDomain(new URL(origin).hostname)
  } catch {
    return false
  }
  return originHost === siteDomain || originHost.endsWith(`.${siteDomain}`)
}

function shortText(value: unknown, max = 200) {
  return typeof value === "string" && value.length > 0 ? value.slice(0, max) : null
}

// Keep only the referring hostname, and drop visits that came from the site itself
function referrerHost(value: unknown, siteDomain: string) {
  if (typeof value !== "string" || !value) return null
  try {
    const host = normalizeDomain(new URL(value).hostname)
    if (!host || host === siteDomain || host.endsWith(`.${siteDomain}`)) return null
    return host.slice(0, 253)
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // The tracker sends text/plain so browsers skip the CORS preflight
    const body = await request
      .text()
      .then((text) => JSON.parse(text))
      .catch(() => null)

    if (!body || typeof body !== "object") {
      return json({ error: "Invalid payload" }, 400)
    }

    const { type, siteId, id, path } = body

    if (
      (type !== "pageview" && type !== "duration") ||
      !isUuid(siteId) ||
      !isUuid(id) ||
      typeof path !== "string" ||
      !path.startsWith("/") ||
      path.length > MAX_URL_LENGTH
    ) {
      return json({ error: "Invalid payload" }, 400)
    }

    const userAgent = request.headers.get("user-agent") || ""
    if (isBot(userAgent)) {
      return json({ success: false, reason: "bot" }, 202)
    }

    const ip = getClientIp(request.headers)
    if (isRateLimited(`${siteId}:${ip || "unknown"}`, MAX_EVENTS_PER_MINUTE)) {
      return json({ error: "Too many requests" }, 429)
    }

    const db = getDb()

    const [site] = await db
      .select({ id: schema.sites.id, userId: schema.sites.userId, domain: schema.sites.domain })
      .from(schema.sites)
      .where(eq(schema.sites.id, siteId))
      .limit(1)

    if (!site) {
      return json({ error: "Site not found" }, 404)
    }

    if (!originMatchesSite(request.headers.get("origin"), site.domain)) {
      return json({ error: "Origin not allowed for this site" }, 403)
    }

    if (type === "duration") {
      const seconds = Number(body.duration)
      if (Number.isFinite(seconds) && seconds >= 0) {
        await db
          .update(schema.pageViews)
          .set({ duration: Math.min(Math.round(seconds), 86_400) })
          .where(and(eq(schema.pageViews.id, id), eq(schema.pageViews.siteId, siteId)))
      }
      return json({ success: true })
    }

    // Count the pageview against the owner's monthly allowance (resets each UTC month)
    const [usage] = await db
      .insert(schema.usage)
      .values({ userId: site.userId, pageviews: 1 })
      .onConflictDoUpdate({
        target: schema.usage.userId,
        set: {
          pageviews: sql`case when ${schema.usage.periodStart} < date_trunc('month', now()) then 1 else ${schema.usage.pageviews} + 1 end`,
          periodStart: sql`case when ${schema.usage.periodStart} < date_trunc('month', now()) then now() else ${schema.usage.periodStart} end`,
        },
      })
      .returning({ pageviews: schema.usage.pageviews, plan: schema.usage.plan })

    if (usage.pageviews > getPlan(usage.plan).pageviewLimit) {
      return json({ success: false, reason: "plan_limit_exceeded" })
    }

    const visitorId = await getVisitorId(siteId, ip, userAgent)

    // Continue the visitor's session if they were active in the last 30 minutes
    const [recent] = await db
      .select({ sessionId: schema.pageViews.sessionId })
      .from(schema.pageViews)
      .where(
        and(
          eq(schema.pageViews.siteId, siteId),
          eq(schema.pageViews.visitorId, visitorId),
          gte(schema.pageViews.createdAt, new Date(Date.now() - SESSION_WINDOW_MS)),
        ),
      )
      .orderBy(desc(schema.pageViews.createdAt))
      .limit(1)

    const geo = lookupGeo(request.headers, ip)
    const agent = parseUserAgent(userAgent)

    await db
      .insert(schema.pageViews)
      .values({
        id,
        siteId,
        visitorId,
        sessionId: recent?.sessionId ?? randomUUID(),
        path,
        referrer: referrerHost(body.referrer, site.domain),
        utmSource: shortText(body.utmSource),
        utmMedium: shortText(body.utmMedium),
        utmCampaign: shortText(body.utmCampaign),
        ...geo,
        ...agent,
      })
      .onConflictDoNothing()

    return json({ success: true })
  } catch (error) {
    console.error("Tracking error:", error)
    return json({ error: "Internal server error" }, 500)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
