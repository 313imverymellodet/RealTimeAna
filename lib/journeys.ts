import "server-only"
import { sql } from "drizzle-orm"
import { rangeStart, rows, type RangeKey } from "@/lib/stats"

export interface VisitorSummary {
  id: string
  firstSeen: string
  lastSeen: string
  pageviews: number
  seconds: number
  entryPage: string
  country: string | null
  city: string | null
  device: string | null
  browser: string | null
  os: string | null
  referrer: string | null
  campaign: string | null
  goals: number
  revenueCents: number
}

export interface JourneyStep {
  kind: "page" | "goal"
  at: string
  // Page path, or goal name
  label: string
  // Seconds on the page, for page steps
  seconds: number | null
  revenueCents: number | null
}

export function isVisitorId(value: string) {
  return /^[0-9a-f]{32}$/.test(value)
}

// Most recently active visitors in the range. A visitor id lasts one day, so
// each row is one person's activity on one day.
export async function listVisitors(siteId: string, range: RangeKey, timeZone: string): Promise<VisitorSummary[]> {
  const from = rangeStart(range, timeZone)

  const data = await rows<Record<string, string | null>>(sql`
    with seen as (
      select
        visitor_id,
        min(created_at) as first_seen,
        max(created_at) as last_seen,
        count(*) as pageviews,
        coalesce(sum(duration), 0) as seconds,
        (array_agg(path order by created_at))[1] as entry_page,
        (array_agg(country order by created_at))[1] as country,
        (array_agg(city order by created_at))[1] as city,
        (array_agg(device order by created_at))[1] as device,
        (array_agg(browser order by created_at))[1] as browser,
        (array_agg(os order by created_at))[1] as os,
        (array_agg(referrer order by created_at))[1] as referrer,
        (array_agg(coalesce(utm_campaign, utm_source) order by created_at))[1] as campaign
      from page_views
      where site_id = ${siteId} and created_at >= ${from}
      group by visitor_id
      order by last_seen desc
      limit 30
    ),
    converted as (
      select visitor_id, count(*) as goals, coalesce(sum(revenue_cents), 0) as revenue
      from events
      where site_id = ${siteId} and created_at >= ${from}
      group by visitor_id
    )
    select seen.*, coalesce(converted.goals, 0) as goals, coalesce(converted.revenue, 0) as revenue
    from seen
    left join converted using (visitor_id)
    order by seen.last_seen desc
  `)

  return data.map((r) => ({
    id: r.visitor_id!,
    firstSeen: new Date(r.first_seen!).toISOString(),
    lastSeen: new Date(r.last_seen!).toISOString(),
    pageviews: Number(r.pageviews),
    seconds: Number(r.seconds),
    entryPage: r.entry_page || "/",
    country: r.country,
    city: r.city,
    device: r.device,
    browser: r.browser,
    os: r.os,
    referrer: r.referrer,
    campaign: r.campaign,
    goals: Number(r.goals),
    revenueCents: Number(r.revenue),
  }))
}

// Every page view and goal for one visitor, oldest first
export async function getJourney(siteId: string, visitorId: string): Promise<JourneyStep[]> {
  const data = await rows<Record<string, string | null>>(sql`
    select 'page' as kind, created_at as at, path as label, duration as seconds, null::int as revenue
    from page_views
    where site_id = ${siteId} and visitor_id = ${visitorId}
    union all
    select 'goal' as kind, created_at as at, name as label, null::int as seconds, revenue_cents as revenue
    from events
    where site_id = ${siteId} and visitor_id = ${visitorId}
    order by at
    limit 300
  `)

  return data.map((r) => ({
    kind: r.kind === "goal" ? "goal" : "page",
    at: new Date(r.at!).toISOString(),
    label: r.label || "",
    seconds: r.seconds === null ? null : Number(r.seconds),
    revenueCents: r.revenue === null ? null : Number(r.revenue),
  }))
}
