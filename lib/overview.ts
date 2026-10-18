import "server-only"
import { sql, type SQL } from "drizzle-orm"
import { RANGES, rows, totals, type RangeKey, type Totals } from "@/lib/stats"

// The "All sites" view: every one of an owner's sites merged into one set of
// numbers and one chart, plus each site's share for comparison.

export interface OverviewSite {
  id: string
  name: string
  domain: string
  totals: Totals
  previous: Totals
  // People on the site in the last 5 minutes
  live: number
}

export interface OverviewPoint {
  t: string
  visitors: number
  pageviews: number
  // Whole currency units, to match the single-site chart
  revenue: number
  // Each site's share of this bucket, keyed by site id
  bySite: Record<string, { visitors: number; pageviews: number }>
}

export interface Overview {
  range: RangeKey
  unit: "hour" | "day"
  totals: Totals
  previous: Totals
  live: number
  series: OverviewPoint[]
  sites: OverviewSite[]
}

interface SiteInfo {
  id: string
  name: string
  domain: string
}

export async function getOverview(sites: SiteInfo[], range: RangeKey, timeZone: string): Promise<Overview> {
  const { unit, days } = RANGES[range]
  const ids = sites.map((site) => site.id)
  if (ids.length === 0) {
    const empty: Totals = { visitors: 0, pageviews: 0, sessions: 0, bounceRate: 0, avgDuration: 0, conversions: 0, conversionRate: 0, revenueCents: 0 }
    return { range, unit, totals: empty, previous: empty, live: 0, series: [], sites: [] }
  }

  const from = sql`(date_trunc('day', now() at time zone ${timeZone}) - make_interval(days => ${days - 1}::int)) at time zone ${timeZone}`
  const previousFrom = sql`(date_trunc('day', now() at time zone ${timeZone}) - make_interval(days => ${days * 2 - 1}::int)) at time zone ${timeZone}`
  const step = unit === "hour" ? sql`interval '1 hour'` : sql`interval '1 day'`
  const unitSql = sql.raw(`'${unit}'`)
  const all: SQL = sql`site_id in (${sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  )})`

  const [current, previous, buckets, perSite, perSiteTotals, live] = await Promise.all([
    totals(all, from),
    totals(all, previousFrom, from),
    // Every bucket in the range, with merged visits and revenue (empty buckets as zero)
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
          count(distinct (site_id, visitor_id)) as visitors,
          count(*) as pageviews
        from page_views
        where ${all} and created_at >= ${from}
        group by 1
      ),
      earned as (
        select date_trunc(${unitSql}, created_at at time zone ${timeZone}) as bucket, sum(revenue_cents) as revenue
        from events
        where ${all} and created_at >= ${from} and revenue_cents is not null
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
    rows<{ t: string; site_id: string; visitors: string; pageviews: string }>(sql`
      select
        to_char(date_trunc(${unitSql}, created_at at time zone ${timeZone}), 'YYYY-MM-DD"T"HH24:MI:SS') as t,
        site_id,
        count(distinct visitor_id) as visitors,
        count(*) as pageviews
      from page_views
      where ${all} and created_at >= ${from}
      group by 1, 2
    `),
    // Each site's own totals, for the comparison table
    Promise.all(
      ids.map(async (id) => {
        const scope = sql`site_id = ${id}`
        const [now, before] = await Promise.all([totals(scope, from), totals(scope, previousFrom, from)])
        return [id, { now, before }] as const
      }),
    ),
    rows<{ site_id: string; visitors: string }>(sql`
      select site_id, count(distinct visitor_id) as visitors
      from page_views
      where ${all} and created_at >= now() - interval '5 minutes'
      group by 1
    `),
  ])

  const bySiteAt = new Map<string, Record<string, { visitors: number; pageviews: number }>>()
  for (const row of perSite) {
    const entry = bySiteAt.get(row.t) ?? {}
    entry[row.site_id] = { visitors: Number(row.visitors), pageviews: Number(row.pageviews) }
    bySiteAt.set(row.t, entry)
  }
  const liveBySite = new Map(live.map((row) => [row.site_id, Number(row.visitors)]))
  const totalsBySite = new Map(perSiteTotals)

  return {
    range,
    unit,
    totals: current,
    previous,
    live: [...liveBySite.values()].reduce((sum, n) => sum + n, 0),
    series: buckets.map((row) => ({
      t: row.t,
      visitors: Number(row.visitors),
      pageviews: Number(row.pageviews),
      revenue: Number(row.revenue) / 100,
      bySite: Object.fromEntries(ids.map((id) => [id, bySiteAt.get(row.t)?.[id] ?? { visitors: 0, pageviews: 0 }])),
    })),
    sites: sites
      .map((site) => ({
        ...site,
        totals: totalsBySite.get(site.id)!.now,
        previous: totalsBySite.get(site.id)!.before,
        live: liveBySite.get(site.id) ?? 0,
      }))
      .sort((a, b) => b.totals.visitors - a.totals.visitors),
  }
}
