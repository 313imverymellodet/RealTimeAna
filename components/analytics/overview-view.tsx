"use client"

import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react"
import { useMemo, useState } from "react"
import { LiveDot } from "@/components/brand"
import { formatDuration, formatMoney, formatNumber, percentChange } from "@/lib/format"
import type { Overview, OverviewSite } from "@/lib/overview"
import type { RangeKey } from "@/lib/stats"
import { cn } from "@/lib/utils"
import { RANGE_KEYS, RANGE_OPTIONS } from "./dashboard-view"
import { MetricsChart, type ChartPoint, type StackedSeries } from "./metrics-chart"
import { Panel, Segmented } from "./primitives"
import { StatTile } from "./stat-tile"
import { usePolling } from "./use-polling"
import { useQueryParam } from "./use-query-param"

// Every site an owner runs, merged into one set of numbers and one chart

type Metric = "visitors" | "pageviews"

// Kept apart from the channel colours (and the revenue teal) so a site band is
// never mistaken for a traffic source. The last one is for "Other sites".
const SITE_COLORS = ["#f5a623", "#0071e3", "#d6336c", "#7c3aed", "#2f9e44", "#e8590c"]
const OTHER_COLOR = "#adb5bd"

const overviewDelay = () => 60_000

function Change({ value, invert = false }: { value: number | null; invert?: boolean }) {
  if (value === null) return <span className="text-muted-foreground">–</span>
  const good = invert ? value <= 0 : value >= 0
  const Arrow = value >= 0 ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn("inline-flex items-center gap-0.5", good ? "text-success" : "text-red-600")}>
      <Arrow className="size-3" aria-hidden />
      {Math.abs(value)}%
    </span>
  )
}

function SiteRow({
  site,
  color,
  share,
  metric,
  onOpen,
}: {
  site: OverviewSite
  color: string
  share: number
  metric: Metric
  onOpen: () => void
}) {
  return (
    <li>
      <a
        href={`/dashboard?site=${site.id}`}
        onClick={(event) => {
          // Plain clicks switch in place; new-tab clicks follow the link
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
          event.preventDefault()
          onOpen()
        }}
        className="group grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-2xl px-3 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring md:grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))_16px]"
      >
        <div className="min-w-0">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: color }} aria-hidden />
            <span className="truncate">{site.domain}</span>
          </p>
          <div className="mt-1.5 ml-4.5 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div className="h-full rounded-full" style={{ width: `${share}%`, background: color }} />
          </div>
          <span className="sr-only">
            {share}% of all {metric}
          </span>
        </div>

        <p className="tabular flex items-center justify-end gap-1.5 text-sm md:justify-start">
          {site.live > 0 && <LiveDot />}
          <span className={site.live > 0 ? "font-medium" : "text-muted-foreground"}>{formatNumber(site.live)}</span>
          <span className="text-xs text-muted-foreground md:sr-only">live</span>
        </p>

        <dl className="col-span-2 grid grid-cols-4 gap-3 text-sm md:contents">
          <div>
            <dt className="text-[11px] text-muted-foreground md:sr-only">Visitors</dt>
            <dd className="tabular font-medium">{formatNumber(site.totals.visitors)}</dd>
            <dd className="tabular text-[11px]">
              <Change value={percentChange(site.totals.visitors, site.previous.visitors)} />
            </dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground md:sr-only">Pageviews</dt>
            <dd className="tabular">{formatNumber(site.totals.pageviews)}</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground md:sr-only">Conversion</dt>
            <dd className="tabular">{site.totals.conversionRate}%</dd>
          </div>
          <div>
            <dt className="text-[11px] text-muted-foreground md:sr-only">Revenue</dt>
            <dd className={cn("tabular", site.totals.revenueCents > 0 && "font-medium text-revenue")}>
              {formatMoney(site.totals.revenueCents)}
            </dd>
          </div>
        </dl>

        <ChevronRight
          className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 md:block"
          aria-hidden
        />
      </a>
    </li>
  )
}

export function OverviewView({ onOpenSite }: { onOpenSite: (id: string) => void }) {
  const [range, setRange] = useQueryParam<RangeKey>("range", "7d", RANGE_KEYS)
  const [metric, setMetric] = useState<Metric>("visitors")
  const [split, setSplit] = useQueryParam<"combined" | "sites">("chart", "combined", ["combined", "sites"])

  const url = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return `/api/overview?range=${range}&tz=${encodeURIComponent(tz)}`
  }, [range])
  const { data, loading, failed } = usePolling<Overview>(url, overviewDelay)

  // The busiest sites get their own band; any beyond that share one "Other" band
  const { stacks, colorOf } = useMemo(() => {
    const sites = data?.sites ?? []
    const named = sites.slice(0, sites.length > SITE_COLORS.length ? SITE_COLORS.length - 1 : SITE_COLORS.length)
    const list: StackedSeries[] = named.map((site, i) => ({ key: `s${i}`, label: site.domain, color: SITE_COLORS[i] }))
    if (sites.length > named.length) list.push({ key: "other", label: "Other sites", color: OTHER_COLOR })
    const colors = new Map(sites.map((site, i) => [site.id, i < named.length ? SITE_COLORS[i] : OTHER_COLOR]))
    return { stacks: list, colorOf: colors }
  }, [data])

  const series = useMemo<ChartPoint[] | null>(() => {
    if (!data) return null
    const named = stacks.filter((stack) => stack.key !== "other").length
    return data.series.map((point) => {
      const row: ChartPoint = { t: point.t, visitors: point.visitors, pageviews: point.pageviews, revenue: point.revenue }
      let other = 0
      data.sites.forEach((site, i) => {
        const value = point.bySite[site.id]?.[metric] ?? 0
        if (i < named) row[`s${i}`] = value
        else other += value
      })
      if (named < data.sites.length) row.other = other
      return row
    })
  }, [data, stacks, metric])

  const totals = data?.totals
  const previous = data?.previous
  const sum = Math.max(1, totals?.[metric] ?? 0)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">All sites</h1>
          <p className="truncate text-sm text-muted-foreground">
            {data ? `${data.sites.length} websites, counted together` : "Every website, counted together"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <LiveDot />
            <span className="tabular">{formatNumber(data?.live ?? 0)}</span>
            <span className="text-muted-foreground">in the house</span>
          </span>
          <Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} label="Date range" />
        </div>
      </div>

      {failed && !data && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          Could not load your sites. Retrying automatically.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatTile
          label="Visitors"
          value={formatNumber(totals?.visitors ?? 0)}
          change={totals && previous ? percentChange(totals.visitors, previous.visitors) : null}
          loading={loading}
          selected={metric === "visitors"}
          onSelect={() => setMetric("visitors")}
        />
        <StatTile
          label="Pageviews"
          value={formatNumber(totals?.pageviews ?? 0)}
          change={totals && previous ? percentChange(totals.pageviews, previous.pageviews) : null}
          loading={loading}
          selected={metric === "pageviews"}
          onSelect={() => setMetric("pageviews")}
        />
        <StatTile
          label="Conversion rate"
          value={`${totals?.conversionRate ?? 0}%`}
          change={totals && previous ? percentChange(totals.conversionRate, previous.conversionRate) : null}
          loading={loading}
        />
        <StatTile
          label="Revenue"
          value={formatMoney(totals?.revenueCents ?? 0)}
          change={totals && previous ? percentChange(totals.revenueCents, previous.revenueCents) : null}
          loading={loading}
        />
        <StatTile
          label="Bounce rate"
          value={`${totals?.bounceRate ?? 0}%`}
          change={totals && previous ? percentChange(totals.bounceRate, previous.bounceRate) : null}
          invert
          loading={loading}
        />
        <StatTile
          label="Visit duration"
          value={formatDuration(totals?.avgDuration ?? 0)}
          change={totals && previous ? percentChange(totals.avgDuration, previous.avgDuration) : null}
          loading={loading}
        />
      </div>

      <section
        className="rounded-3xl border border-border bg-card p-4 shadow-[0_1px_3px_rgb(0_0_0/0.04)]"
        aria-label={`${metric} and revenue over time, all sites`}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium">
            {metric === "visitors" ? "Visitors" : "Pageviews"} and revenue
            <span className="font-normal text-muted-foreground"> · all sites</span>
          </h2>
          <Segmented
            value={split}
            onChange={setSplit}
            label="Chart view"
            options={[
              { value: "combined", label: "Combined" },
              { value: "sites", label: "By site" },
            ]}
          />
        </div>
        <MetricsChart
          series={series}
          unit={data?.unit ?? "day"}
          metric={metric}
          stacks={split === "sites" ? stacks : undefined}
        />
      </section>

      <Panel title="Sites">
        <div
          className="hidden grid-cols-[minmax(0,1.6fr)_repeat(5,minmax(0,1fr))_16px] gap-x-4 px-3 pt-1 pb-2 text-[11px] font-medium text-muted-foreground md:grid"
          aria-hidden
        >
          <span>Website</span>
          <span>Live now</span>
          <span>Visitors</span>
          <span>Pageviews</span>
          <span>Conversion</span>
          <span>Revenue</span>
          <span />
        </div>
        {data ? (
          <ul>
            {data.sites.map((site) => (
              <SiteRow
                key={site.id}
                site={site}
                color={colorOf.get(site.id) ?? OTHER_COLOR}
                share={Math.round((site.totals[metric] / sum) * 100)}
                metric={metric}
                onOpen={() => onOpenSite(site.id)}
              />
            ))}
          </ul>
        ) : (
          <div className="space-y-1.5 p-1" aria-hidden>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-14 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}
