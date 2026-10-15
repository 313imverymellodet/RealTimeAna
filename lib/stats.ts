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
  // Goal completions, the share of visitors who completed any goal, and reported revenue in cents
  conversions: number
  conversionRate: number
  revenueCents: number
}

export interface BreakdownRow {
  label: string
  visitors: number
  pageviews: number
  // Revenue in cents attributed to this row, when the site reports revenue
  revenueCents?: number
}

export interface StoryRow {
  path: string
  readers: number
  views: number
  // Average seconds visible, over views that reported a time
  avgSeconds: number
  // Average percentage of the page reached, or null before any depth was reported
  depth: number | null
  // Share of views that reached 90% of the page
  finished: number | null
}

export interface TrendingStory {
  path: string
  // People on the page in the last 5 minutes
  now: number
  // Distinct readers over the last 30 minutes
  recent: number
  // Readers in each 3-minute slice of the last 30 minutes, oldest first
  spark: number[]
  // Picking up speed: the last 10 minutes are well ahead of the 20 before
  rising: boolean
}

export interface GoalRow {
  name: string
  completions: number
  visitors: number
  revenueCents: number
}

export interface Stats {
  range: RangeKey
  unit: "hour" | "day"
  hasData: boolean
  totals: Totals
  previous: Totals
  series: { t: string; visitors: number; pageviews: number; revenue: number }[]
  // Busiest single day in the past year, for the "house record"
  record: { visitors: number; day: string } | null
  // Distinct visitors so far today
  today: number
  pages: BreakdownRow[]
  stories: StoryRow[]
  entryPages: BreakdownRow[]
  channels: BreakdownRow[]
  networks: BreakdownRow[]
  referrers: BreakdownRow[]
  campaigns: BreakdownRow[]
  countries: BreakdownRow[]
  cities: BreakdownRow[]
  goals: GoalRow[]
  devices: BreakdownRow[]
  browsers: BreakdownRow[]
  systems: BreakdownRow[]
}

export interface Seat {
  // Short anonymous key, stable for the visitor's day, used to keep them in the same seat
  id: string
  channel: string
  // Where they came from, what they are reading and their country, for the seat's tooltip
  source: string | null
  path: string
  country: string | null
}

export interface Arrival {
  at: string
  channel: string
  source: string | null
  city: string | null
  country: string | null
  path: string
}

export interface Realtime {
  visitors: number
  pages: { label: string; visitors: number }[]
  points: { lat: number; lng: number; city: string | null; country: string | null }[]
  // One per person on the site in the last 5 minutes
  seats: Seat[]
  // The most recent sessions to start, newest first
  arrivals: Arrival[]
  trending: TrendingStory[]
}

// Start of a range in the viewer's time zone, as a SQL timestamp expression
export function rangeStart(range: RangeKey, timeZone: string): SQL {
  return sql`(date_trunc('day', now() at time zone ${timeZone}) - make_interval(days => ${RANGES[range].days - 1}::int)) at time zone ${timeZone}`
}

export async function rows<T>(query: SQL): Promise<T[]> {
  const result = await getDb().execute(query)
  return result.rows as T[]
}

// `to` is exclusive; leave it out for "up to and including right now", so a
// visit recorded in the same instant as the query is never missed
async function totals(siteId: string, from: SQL, to?: SQL): Promise<Totals> {
  const upTo = to ? sql`and created_at < ${to}` : sql``
  const [row] = await rows<Record<string, string | null>>(sql`
    with scoped as (
      select visitor_id, session_id, duration
      from page_views
      where site_id = ${siteId} and created_at >= ${from} ${upTo}
    ),
    per_session as (
      select session_id, count(*) as views, sum(duration) as seconds
      from scoped
      group by session_id
    ),
    goals as (
      select visitor_id, revenue_cents
      from events
      where site_id = ${siteId} and created_at >= ${from} ${upTo}
    )
    select
      (select count(distinct visitor_id) from scoped) as visitors,
      (select count(*) from scoped) as pageviews,
      (select count(*) from per_session) as sessions,
      (select count(*) from per_session where views = 1) as bounces,
      (select coalesce(avg(seconds), 0) from per_session) as avg_duration,
      (select count(*) from goals) as conversions,
      (select count(distinct visitor_id) from goals) as converters,
      (select coalesce(sum(revenue_cents), 0) from goals) as revenue_cents
  `)

  const sessions = Number(row.sessions)
  const visitors = Number(row.visitors)
  return {
    visitors,
    pageviews: Number(row.pageviews),
    sessions,
    bounceRate: sessions > 0 ? Math.round((Number(row.bounces) / sessions) * 1000) / 10 : 0,
    avgDuration: Math.round(Number(row.avg_duration)),
    conversions: Number(row.conversions),
    conversionRate: visitors > 0 ? Math.round((Math.min(Number(row.converters), visitors) / visitors) * 1000) / 10 : 0,
    revenueCents: Number(row.revenue_cents),
  }
}

// Revenue per value of an attribution column on the events table
async function revenueBy(siteId: string, from: SQL, column: SQL, filter: SQL = sql`true`): Promise<Map<string, number>> {
  const data = await rows<{ label: string; revenue: string }>(sql`
    select ${column} as label, coalesce(sum(revenue_cents), 0) as revenue
    from events
    where site_id = ${siteId} and created_at >= ${from} and revenue_cents is not null and ${filter}
    group by 1
  `)
  return new Map(data.map((r) => [r.label, Number(r.revenue)]))
}

function withRevenue(list: BreakdownRow[], revenue: Map<string, number>): BreakdownRow[] {
  return list.map((row) => ({ ...row, revenueCents: revenue.get(row.label) ?? 0 }))
}

async function breakdown(
  siteId: string,
  from: SQL,
  column: SQL,
  limit = 8,
  filter: SQL = sql`true`,
): Promise<BreakdownRow[]> {
  const data = await rows<{ label: string; visitors: string; pageviews: string }>(sql`
    select ${column} as label, count(distinct visitor_id) as visitors, count(*) as pageviews
    from page_views
    where site_id = ${siteId} and created_at >= ${from} and ${filter}
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
  const step = unit === "hour" ? sql`interval '1 hour'` : sql`interval '1 day'`
  const unitSql = sql.raw(`'${unit}'`)

  const referrerColumn = sql`coalesce(referrer, 'Direct / none')`
  // A post or campaign is named by utm_campaign (the tracker also files ?ref=name there)
  const campaignColumn = sql`utm_campaign`
  const countryColumn = sql`coalesce(country, 'Unknown')`
  const channelColumn = sql`coalesce(channel, 'Direct')`
  const networkColumn = sql`coalesce(network, referrer, 'Other')`
  const isSocial = sql`channel = 'Social'`

  const [
    current,
    previous,
    series,
    pages,
    referrers,
    countries,
    devices,
    browsers,
    systems,
    any,
    entryPages,
    campaigns,
    cities,
    goals,
    referrerRevenue,
    campaignRevenue,
    countryRevenue,
    channels,
    networks,
    channelRevenue,
    networkRevenue,
    record,
    today,
    stories,
  ] = await Promise.all([
    totals(siteId, from),
    totals(siteId, previousFrom, from),
    rows<{ t: string; visitors: string; pageviews: string; revenue: string }>(sql`
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
      ),
      earned as (
        select
          date_trunc(${unitSql}, created_at at time zone ${timeZone}) as bucket,
          sum(revenue_cents) as revenue
        from events
        where site_id = ${siteId} and created_at >= ${from} and revenue_cents is not null
        group by 1
      )
      select
        to_char(buckets.bucket, 'YYYY-MM-DD"T"HH24:MI:SS') as t,
        coalesce(counted.visitors, 0) as visitors,
        coalesce(counted.pageviews, 0) as pageviews,
        coalesce(earned.revenue, 0) as revenue
      from buckets
      left join counted using (bucket)
      left join earned using (bucket)
      order by buckets.bucket
    `),
    breakdown(siteId, from, sql`path`, 10),
    breakdown(siteId, from, referrerColumn),
    breakdown(siteId, from, countryColumn),
    breakdown(siteId, from, sql`coalesce(device, 'Other')`),
    breakdown(siteId, from, sql`coalesce(browser, 'Other')`),
    breakdown(siteId, from, sql`coalesce(os, 'Other')`),
    rows(sql`select 1 from page_views where site_id = ${siteId} limit 1`),
    // First page of each session
    rows<{ label: string; visitors: string; pageviews: string }>(sql`
      with firsts as (
        select distinct on (session_id) session_id, visitor_id, path
        from page_views
        where site_id = ${siteId} and created_at >= ${from}
        order by session_id, created_at
      )
      select path as label, count(distinct visitor_id) as visitors, count(*) as pageviews
      from firsts
      group by 1
      order by visitors desc
      limit 10
    `).then((list) => list.map((r) => ({ label: r.label, visitors: Number(r.visitors), pageviews: Number(r.pageviews) }))),
    breakdown(siteId, from, campaignColumn, 8, sql`${campaignColumn} is not null`),
    breakdown(siteId, from, sql`city || ', ' || coalesce(country, '')`, 8, sql`city is not null`),
    rows<{ name: string; completions: string; visitors: string; revenue: string }>(sql`
      select name, count(*) as completions, count(distinct visitor_id) as visitors, coalesce(sum(revenue_cents), 0) as revenue
      from events
      where site_id = ${siteId} and created_at >= ${from}
      group by 1
      order by completions desc
      limit 10
    `),
    revenueBy(siteId, from, referrerColumn),
    revenueBy(siteId, from, sql`coalesce(${campaignColumn}, '')`),
    revenueBy(siteId, from, countryColumn),
    breakdown(siteId, from, channelColumn),
    breakdown(siteId, from, networkColumn, 8, isSocial),
    revenueBy(siteId, from, channelColumn),
    revenueBy(siteId, from, networkColumn, isSocial),
    rows<{ day: string; visitors: string }>(sql`
      select to_char(date_trunc('day', created_at at time zone ${timeZone}), 'YYYY-MM-DD') as day,
             count(distinct visitor_id) as visitors
      from page_views
      where site_id = ${siteId} and created_at >= now() - interval '365 days'
      group by 1
      order by visitors desc, day desc
      limit 1
    `),
    rows<{ visitors: string }>(sql`
      select count(distinct visitor_id) as visitors
      from page_views
      where site_id = ${siteId}
        and created_at >= date_trunc('day', now() at time zone ${timeZone}) at time zone ${timeZone}
    `),
    rows<{ path: string; readers: string; views: string; seconds: string | null; depth: string | null; finished: string | null }>(sql`
      select
        path,
        count(distinct visitor_id) as readers,
        count(*) as views,
        avg(duration) filter (where duration > 0) as seconds,
        avg(depth) filter (where depth is not null) as depth,
        avg(case when depth >= 90 then 100.0 else 0 end) filter (where depth is not null) as finished
      from page_views
      where site_id = ${siteId} and created_at >= ${from}
      group by path
      order by readers desc, views desc
      limit 12
    `),
  ])

  return {
    range,
    unit,
    hasData: any.length > 0,
    totals: current,
    previous,
    series: series.map((r) => ({
      t: r.t,
      visitors: Number(r.visitors),
      pageviews: Number(r.pageviews),
      revenue: Number(r.revenue) / 100,
    })),
    record: record[0] ? { visitors: Number(record[0].visitors), day: record[0].day } : null,
    today: Number(today[0]?.visitors ?? 0),
    pages,
    stories: stories.map((r) => ({
      path: r.path,
      readers: Number(r.readers),
      views: Number(r.views),
      avgSeconds: Math.round(Number(r.seconds ?? 0)),
      depth: r.depth === null ? null : Math.round(Number(r.depth)),
      finished: r.finished === null ? null : Math.round(Number(r.finished)),
    })),
    entryPages,
    channels: withRevenue(channels, channelRevenue),
    networks: withRevenue(networks, networkRevenue),
    referrers: withRevenue(referrers, referrerRevenue),
    campaigns: withRevenue(campaigns, campaignRevenue),
    countries: withRevenue(countries, countryRevenue),
    cities,
    goals: goals.map((g) => ({
      name: g.name,
      completions: Number(g.completions),
      visitors: Number(g.visitors),
      revenueCents: Number(g.revenue),
    })),
    devices,
    browsers,
    systems,
  }
}

export async function getRealtime(siteId: string): Promise<Realtime> {
  const [[count], pages, points, seats, arrivals, minutes] = await Promise.all([
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
    rows<{ id: string; channel: string; source: string | null; path: string; country: string | null }>(sql`
      select distinct on (visitor_id)
        left(visitor_id, 12) as id, coalesce(channel, 'Direct') as channel,
        coalesce(network, referrer) as source, path, country
      from page_views
      where site_id = ${siteId} and created_at >= now() - interval '5 minutes'
      order by visitor_id, created_at desc
      limit 400
    `),
    // Sessions whose first page view happened in the last 5 minutes
    rows<{ at: string; channel: string; source: string | null; city: string | null; country: string | null; path: string }>(sql`
      select created_at as at, channel, source, city, country, path
      from (
        select distinct on (session_id)
          created_at, coalesce(channel, 'Direct') as channel, coalesce(network, referrer) as source, city, country, path
        from page_views
        where site_id = ${siteId} and created_at >= now() - interval '40 minutes'
        order by session_id, created_at
      ) starts
      where created_at >= now() - interval '5 minutes'
      order by created_at desc
      limit 5
    `),
    // Readers per page per 3-minute slice over the last 30 minutes (slice 0 is the newest)
    rows<{ path: string; slice: number; readers: string }>(sql`
      select path, floor(extract(epoch from now() - created_at) / 180)::int as slice, count(distinct visitor_id) as readers
      from page_views
      where site_id = ${siteId} and created_at >= now() - interval '30 minutes'
      group by 1, 2
    `),
  ])

  // Rank pages by people on them now, then by the last half hour
  const byPath = new Map<string, number[]>()
  for (const row of minutes) {
    const slots = byPath.get(row.path) ?? Array<number>(10).fill(0)
    const slice = Math.min(Math.max(row.slice, 0), 9)
    slots[9 - slice] += Number(row.readers)
    byPath.set(row.path, slots)
  }
  const nowByPath = new Map(pages.map((p) => [p.label, Number(p.visitors)]))
  const recentByPath = await rows<{ path: string; readers: string }>(sql`
    select path, count(distinct visitor_id) as readers
    from page_views
    where site_id = ${siteId} and created_at >= now() - interval '30 minutes'
    group by 1
    order by readers desc
    limit 20
  `)
  const trending: TrendingStory[] = recentByPath
    .map((row) => {
      const spark = byPath.get(row.path) ?? Array<number>(10).fill(0)
      const lastTen = spark.slice(-3).reduce((a, b) => a + b, 0) + spark[6] / 3
      const before = spark.slice(0, 6).reduce((a, b) => a + b, 0) + (spark[6] * 2) / 3
      return {
        path: row.path,
        now: nowByPath.get(row.path) ?? 0,
        recent: Number(row.readers),
        spark,
        rising: lastTen >= 3 && lastTen > before * 0.75,
      }
    })
    .sort((a, b) => b.now - a.now || b.recent - a.recent)
    .slice(0, 5)

  return {
    visitors: Number(count.visitors),
    pages: pages.map((p) => ({ label: p.label, visitors: Number(p.visitors) })),
    points,
    seats,
    arrivals: arrivals.map((a) => ({ ...a, at: new Date(a.at).toISOString() })),
    trending,
  }
}
