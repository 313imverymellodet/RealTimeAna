import "server-only"
import { sql } from "drizzle-orm"
import { rangeStart, rows, type RangeKey } from "@/lib/stats"

export interface VisitorSummary {
  id: string
  // True when the site identified this person as a signed-in user
  identified: boolean
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

// Most recently active people in the range. A signed-in user the site identified
// is one row across days and devices; anyone else is one daily visitor hash.
export async function listVisitors(siteId: string, range: RangeKey, timeZone: string): Promise<VisitorSummary[]> {
  const from = rangeStart(range, timeZone)

  const data = await rows<Record<string, string | boolean | null>>(sql`
    with views as (
      select coalesce(i.user_id, p.visitor_id) as person, (i.user_id is not null) as identified, p.*
      from page_views p
      left join identities i on i.site_id = p.site_id and i.visitor_id = p.visitor_id
      where p.site_id = ${siteId} and p.created_at >= ${from}
    ),
    seen as (
      select
        person,
        bool_or(identified) as identified,
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
      from views
      group by person
      order by last_seen desc
      limit 30
    ),
    converted as (
      select coalesce(i.user_id, e.visitor_id) as person, count(*) as goals, coalesce(sum(e.revenue_cents), 0) as revenue
      from events e
      left join identities i on i.site_id = e.site_id and i.visitor_id = e.visitor_id
      where e.site_id = ${siteId} and e.created_at >= ${from}
      group by 1
    )
    select seen.*, coalesce(converted.goals, 0) as goals, coalesce(converted.revenue, 0) as revenue
    from seen
    left join converted using (person)
    order by seen.last_seen desc
  `)

  const text = (value: string | boolean | null) => (typeof value === "string" ? value : null)

  return data.map((r) => ({
    id: String(r.person),
    identified: r.identified === true,
    firstSeen: new Date(String(r.first_seen)).toISOString(),
    lastSeen: new Date(String(r.last_seen)).toISOString(),
    pageviews: Number(r.pageviews),
    seconds: Number(r.seconds),
    entryPage: text(r.entry_page) || "/",
    country: text(r.country),
    city: text(r.city),
    device: text(r.device),
    browser: text(r.browser),
    os: text(r.os),
    referrer: text(r.referrer),
    campaign: text(r.campaign),
    goals: Number(r.goals),
    revenueCents: Number(r.revenue),
  }))
}

// Every page view and goal for one person, oldest first. For an identified
// user this spans every day and device they were identified on.
export async function getJourney(siteId: string, personId: string): Promise<JourneyStep[]> {
  const data = await rows<Record<string, string | null>>(sql`
    select *
    from (
      select 'page' as kind, p.created_at as at, p.path as label, p.duration as seconds, null::int as revenue
      from page_views p
      left join identities i on i.site_id = p.site_id and i.visitor_id = p.visitor_id
      where p.site_id = ${siteId} and coalesce(i.user_id, p.visitor_id) = ${personId}
      union all
      select 'goal' as kind, e.created_at as at, e.name as label, null::int as seconds, e.revenue_cents as revenue
      from events e
      left join identities i on i.site_id = e.site_id and i.visitor_id = e.visitor_id
      where e.site_id = ${siteId} and coalesce(i.user_id, e.visitor_id) = ${personId}
      order by at desc
      limit 300
    ) latest
    order by at
  `)

  return data.map((r) => ({
    kind: r.kind === "goal" ? "goal" : "page",
    at: new Date(r.at!).toISOString(),
    label: r.label || "",
    seconds: r.seconds === null ? null : Number(r.seconds),
    revenueCents: r.revenue === null ? null : Number(r.revenue),
  }))
}
