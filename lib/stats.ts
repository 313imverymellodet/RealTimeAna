import "server-only"
import { sql, type SQL } from "drizzle-orm"
import { getDb } from "@/lib/db"

export const RANGES = {
  today: { label: "Today", unit: "hour", days: 1 },
  "7d": { label: "Last 7 days", unit: "day", days: 7 },
  "30d": { label: "Last 30 days", unit: "day", days: 30 },
  "90d": { label: "Last 90 days", unit: "day", days: 90 },
} as const

export type RangeKey = keyof typeof RANGES

export function parseRange(value: string | null): RangeKey {
  return value && value in RANGES ? (value as RangeKey) : "7d"
}

// IANA zone names only, e.g. "America/Detroit"; anything else falls back to UTC
export function parseTimeZone(value: string | null): string {
  return value && /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+){0,2}$/.test(value) && value.length <= 64 ? value : "UTC"
}

export interface Totals {
  visitors: number
  pageviews: number
  sessions: number
  bounceRate: number
  avgDuration: number
}

export interface BreakdownRow {
  label: string
  visitors: number
  pageviews: number
}

export interface Stats {
  range: RangeKey
  unit: "hour" | "day"
  hasData: boolean
  totals: Totals
  previous: Totals
  series: { t: string; visitors: number; pageviews: number }[]
  pages: BreakdownRow[]
  referrers: BreakdownRow[]
  countries: BreakdownRow[]
  devices: BreakdownRow[]
  browsers: BreakdownRow[]
  systems: BreakdownRow[]
}

export interface Realtime {
  visitors: number
  pages: { label: string; visitors: number }[]
  points: { lat: number; lng: number; city: string | null; country: string | null }[]
}

async function rows<T>(query: SQL): Promise<T[]> {
  const result = await getDb().execute(query)
  return result.rows as T[]
}

async function totals(siteId: string, from: SQL, to: SQL): Promise<Totals> {
  const [row] = await rows<Record<string, string | null>>(sql`
    with scoped as (
      select visitor_id, session_id, duration
      from page_views
      where site_id = ${siteId} and created_at >= ${from} and created_at < ${to}
    ),
    per_session as (
      select session_id, count(*) as views, sum(duration) as seconds
      from scoped
      group by session_id
    )
    select
      (select count(distinct visitor_id) from scoped) as visitors,
      (select count(*) from scoped) as pageviews,
      (select count(*) from per_session) as sessions,
      (select count(*) from per_session where views = 1) as bounces,
      (select coalesce(avg(seconds), 0) from per_session) as avg_duration
  `)

  const sessions = Number(row.sessions)
  return {
    visitors: Number(row.visitors),
    pageviews: Number(row.pageviews),
    sessions,
    bounceRate: sessions > 0 ? Math.round((Number(row.bounces) / sessions) * 1000) / 10 : 0,
    avgDuration: Math.round(Number(row.avg_duration)),
  }
}

async function breakdown(siteId: string, from: SQL, column: SQL, limit = 8): Promise<BreakdownRow[]> {
  const data = await rows<{ label: string; visitors: string; pageviews: string }>(sql`
    select ${column} as label, count(distinct visitor_id) as visitors, count(*) as pageviews
    from page_views
    where site_id = ${siteId} and created_at >= ${from}
    group by 1
    order by visitors desc, pageviews desc
    limit ${limit}::int
  `)
  return data.map((r) => ({ label: r.label, visitors: Number(r.visitors), pageviews: Number(r.pageviews) }))
}

export async function getStats(siteId: string, range: RangeKey, timeZone: string): Promise<Stats> {
  const { unit, days } = RANGES[range]

  // "Today" starts at local midnight; the other ranges cover the last N local days including today
  const from = sql`(date_trunc('day', now() at time zone ${timeZone}) - make_interval(days => ${days - 1}::int)) at time zone ${timeZone}`
  const previousFrom = sql`(date_trunc('day', now() at time zone ${timeZone}) - make_interval(days => ${days * 2 - 1}::int)) at time zone ${timeZone}`
  const now = sql`now()`
  const step = unit === "hour" ? sql`interval '1 hour'` : sql`interval '1 day'`
  const unitSql = sql.raw(`'${unit}'`)

  const [current, previous, series, pages, referrers, countries, devices, browsers, systems, any] = await Promise.all([
    totals(siteId, from, now),
    totals(siteId, previousFrom, from),
    rows<{ t: string; visitors: string; pageviews: string }>(sql`
      with buckets as (
        select generate_series(
          date_trunc(${unitSql}, (${from}) at time zone ${timeZone}),
          date_trunc(${unitSql}, now() at time zone ${timeZone}),
          ${step}
        ) as bucket
      ),
      counted as (
        select
          date_trunc(${unitSql}, created_at at time zone ${timeZone}) as bucket,
          count(distinct visitor_id) as visitors,
          count(*) as pageviews
        from page_views
        where site_id = ${siteId} and created_at >= ${from}
        group by 1
      )
      select
        to_char(buckets.bucket, 'YYYY-MM-DD"T"HH24:MI:SS') as t,
        coalesce(counted.visitors, 0) as visitors,
        coalesce(counted.pageviews, 0) as pageviews
      from buckets
      left join counted using (bucket)
      order by buckets.bucket
    `),
    breakdown(siteId, from, sql`path`, 10),
    breakdown(siteId, from, sql`coalesce(referrer, 'Direct / none')`),
    breakdown(siteId, from, sql`coalesce(country, 'Unknown')`),
    breakdown(siteId, from, sql`coalesce(device, 'Other')`),
    breakdown(siteId, from, sql`coalesce(browser, 'Other')`),
    breakdown(siteId, from, sql`coalesce(os, 'Other')`),
    rows(sql`select 1 from page_views where site_id = ${siteId} limit 1`),
  ])

  return {
    range,
    unit,
    hasData: any.length > 0,
    totals: current,
    previous,
    series: series.map((r) => ({ t: r.t, visitors: Number(r.visitors), pageviews: Number(r.pageviews) })),
    pages,
    referrers,
    countries,
    devices,
    browsers,
    systems,
  }
}

export async function getRealtime(siteId: string): Promise<Realtime> {
  const [[count], pages, points] = await Promise.all([
    rows<{ visitors: string }>(sql`
      select count(distinct visitor_id) as visitors
      from page_views
      where site_id = ${siteId} and created_at >= now() - interval '5 minutes'
    `),
    rows<{ label: string; visitors: string }>(sql`
      select path as label, count(distinct visitor_id) as visitors
      from page_views
      where site_id = ${siteId} and created_at >= now() - interval '5 minutes'
      group by 1
      order by visitors desc
      limit 5
    `),
    rows<{ lat: number; lng: number; city: string | null; country: string | null }>(sql`
      select distinct on (visitor_id) latitude as lat, longitude as lng, city, country
      from page_views
      where site_id = ${siteId}
        and created_at >= now() - interval '30 minutes'
        and latitude is not null and longitude is not null
      order by visitor_id, created_at desc
      limit 200
    `),
  ])

  return {
    visitors: Number(count.visitors),
    pages: pages.map((p) => ({ label: p.label, visitors: Number(p.visitors) })),
    points,
  }
}
