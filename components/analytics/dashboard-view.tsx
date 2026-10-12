"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { LiveDot } from "@/components/brand"
import { Globe } from "@/components/globe"
import { channelColor } from "@/lib/channels"
import { countryFlag, countryName, formatDuration, formatMoney, formatNumber, percentChange } from "@/lib/format"
import type { BreakdownRow, RangeKey, Realtime, Stats } from "@/lib/stats"
import { cn } from "@/lib/utils"
import { FunnelPanel } from "./funnel-panel"
import { HousePanel } from "./house-panel"
import { LinkBuilder } from "./link-builder"
import { Panel, Segmented } from "./primitives"
import { usePolling } from "./use-polling"
import { VisitorsPanel } from "./visitors-panel"

const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7D" },
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
]

type Metric = "visitors" | "pageviews"

interface DashboardViewProps {
  title: string
  subtitle?: string
  statsUrl: string
  realtimeUrl: string
  // Shown in place of the charts while the site has never received a page view
  emptyState?: ReactNode
  headerExtra?: ReactNode
  // Funnels are shown when a URL is given; `canEditFunnels` adds create and delete
  funnelsUrl?: string
  canEditFunnels?: boolean
  // Individual visitor journeys (owner and demo only; never on public links)
  visitorsUrl?: string
  // The site's domain; turns on the tracked-link builder
  siteDomain?: string
}

// Check every few seconds until the first page view arrives, then once a minute
const statsDelay = (stats: Stats | null) => (stats && !stats.hasData ? 4_000 : 60_000)
const realtimeDelay = () => 10_000

function BarList({
  rows,
  loading,
  empty,
  renderLabel,
}: {
  rows: BreakdownRow[] | undefined
  loading: boolean
  empty: string
  renderLabel?: (label: string) => ReactNode
}) {
  if (loading) {
    return (
      <div className="space-y-1.5 p-2" aria-hidden>
        {[80, 62, 45, 30].map((width) => (
          <div key={width} className="h-8 animate-pulse rounded-md bg-muted/60" style={{ width: `${width}%` }} />
        ))}
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return <p className="px-2 py-8 text-center text-sm text-muted-foreground">{empty}</p>
  }

  const max = Math.max(...rows.map((row) => row.visitors), 1)

  return (
    <ul className="space-y-1">
      {rows.map((row) => (
        <li key={row.label} className="relative flex h-8 items-center justify-between gap-4 overflow-hidden rounded-md px-2 text-sm">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 rounded-md bg-brand/10"
            style={{ width: `${Math.max((row.visitors / max) * 100, 2)}%` }}
          />
          <span className="relative min-w-0 truncate">{renderLabel ? renderLabel(row.label) : row.label}</span>
          <span className="tabular relative flex shrink-0 items-center gap-3 font-mono text-xs text-muted-foreground">
            {row.revenueCents ? <span className="text-revenue">{formatMoney(row.revenueCents)}</span> : null}
            {formatNumber(row.visitors)}
          </span>
        </li>
      ))}
    </ul>
  )
}

function StatTile({
  label,
  value,
  change,
  // For bounce rate a drop is the good direction
  invert = false,
  loading,
  selected,
  onSelect,
}: {
  label: string
  value: string
  change: number | null
  invert?: boolean
  loading: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const good = change !== null && (invert ? change < 0 : change > 0)
  const content = (
    <>
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {onSelect && <span className={cn("size-1.5 rounded-full", selected ? "bg-brand" : "bg-border")} />}
        {label}
      </span>
      <span className="tabular mt-2 block text-2xl font-semibold tracking-tight">
        {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted/60 align-middle" /> : value}
      </span>
      <span
        className={cn(
          "tabular mt-1 flex h-4 items-center gap-0.5 text-xs font-medium",
          change === null || change === 0 ? "text-muted-foreground" : good ? "text-success" : "text-red-600",
        )}
      >
        {!loading && change !== null && change !== 0 && (
          <>
            {change > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(change)}%<span className="ml-1 font-normal text-muted-foreground">vs previous</span>
          </>
        )}
      </span>
    </>
  )

  const className = cn(
    "rounded-2xl border bg-card p-4 text-left transition-colors",
    selected ? "border-brand/50" : "border-border",
  )

  return onSelect ? (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={cn(className, "hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-ring")}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}

function formatTick(t: string, unit: Stats["unit"]) {
  const date = new Date(t)
  return unit === "hour"
    ? date.toLocaleTimeString("en", { hour: "numeric" })
    : date.toLocaleDateString("en", { month: "short", day: "numeric" })
}

export function DashboardView({
  title,
  subtitle,
  statsUrl,
  realtimeUrl,
  emptyState,
  headerExtra,
  funnelsUrl,
  canEditFunnels = false,
  visitorsUrl,
  siteDomain,
}: DashboardViewProps) {
  const [range, setRange] = useState<RangeKey>("7d")
  const [metric, setMetric] = useState<Metric>("visitors")
  const [pageTab, setPageTab] = useState<"pages" | "entryPages">("pages")
  const [sourceTab, setSourceTab] = useState<"channels" | "networks" | "referrers" | "campaigns">("channels")
  const [linking, setLinking] = useState(false)
  const [locationTab, setLocationTab] = useState<"countries" | "cities">("countries")

  const query = useMemo(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return `?range=${range}&tz=${encodeURIComponent(tz)}`
  }, [range])
  const statsQuery = `${statsUrl}${query}`

  const { data: stats, loading, failed } = usePolling<Stats>(statsQuery, statsDelay)
  const { data: realtime } = usePolling<Realtime>(realtimeUrl, realtimeDelay)

  const online = realtime?.visitors ?? 0
  const hasRevenue = Boolean(stats?.series.some((point) => point.revenue > 0))
  const showEmpty = Boolean(emptyState) && stats !== null && !stats.hasData

  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
            <LiveDot />
            <span className="tabular">{formatNumber(online)}</span>
            <span className="text-muted-foreground">in the house</span>
          </span>
          {headerExtra}
          <Segmented value={range} onChange={setRange} options={RANGE_OPTIONS} label="Date range" />
        </div>
      </div>

      {failed && !stats && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          Could not load analytics. Retrying automatically.
        </p>
      )}

      {showEmpty ? (
        emptyState
      ) : (
        <>
          <HousePanel realtime={realtime} stats={stats} />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatTile
              label="Visitors"
              value={formatNumber(stats?.totals.visitors ?? 0)}
              change={stats ? percentChange(stats.totals.visitors, stats.previous.visitors) : null}
              loading={loading}
              selected={metric === "visitors"}
              onSelect={() => setMetric("visitors")}
            />
            <StatTile
              label="Pageviews"
              value={formatNumber(stats?.totals.pageviews ?? 0)}
              change={stats ? percentChange(stats.totals.pageviews, stats.previous.pageviews) : null}
              loading={loading}
              selected={metric === "pageviews"}
              onSelect={() => setMetric("pageviews")}
            />
            <StatTile
              label="Conversion rate"
              value={`${stats?.totals.conversionRate ?? 0}%`}
              change={stats ? percentChange(stats.totals.conversionRate, stats.previous.conversionRate) : null}
              loading={loading}
            />
            <StatTile
              label="Revenue"
              value={formatMoney(stats?.totals.revenueCents ?? 0)}
              change={stats ? percentChange(stats.totals.revenueCents, stats.previous.revenueCents) : null}
              loading={loading}
            />
            <StatTile
              label="Bounce rate"
              value={`${stats?.totals.bounceRate ?? 0}%`}
              change={stats ? percentChange(stats.totals.bounceRate, stats.previous.bounceRate) : null}
              invert
              loading={loading}
            />
            <StatTile
              label="Visit duration"
              value={formatDuration(stats?.totals.avgDuration ?? 0)}
              change={stats ? percentChange(stats.totals.avgDuration, stats.previous.avgDuration) : null}
              loading={loading}
            />
          </div>

          <section className="rounded-3xl border border-border bg-card shadow-[0_1px_3px_rgb(0_0_0/0.04)] p-4" aria-label={`${metric} over time`}>
            {hasRevenue && (
              <p className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-0.5 w-3 rounded bg-brand" />
                  {metric === "visitors" ? "Visitors" : "Pageviews"}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-sm bg-revenue" />
                  Revenue
                </span>
              </p>
            )}
            <div className="h-64 sm:h-72">
              {stats ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats.series} margin={{ top: 8, right: hasRevenue ? 0 : 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="t"
                      tickFormatter={(t: string) => formatTick(t, stats.unit)}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={32}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      yAxisId="count"
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value: number) => formatNumber(value)}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    {hasRevenue && (
                      <YAxis
                        yAxisId="revenue"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        width={48}
                        tickFormatter={(value: number) => formatMoney(value * 100)}
                        tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      />
                    )}
                    <Tooltip
                      cursor={{ stroke: "var(--border)" }}
                      labelFormatter={(t) => formatTick(String(t), stats.unit)}
                      formatter={(value, name) =>
                        name === "revenue"
                          ? [formatMoney(Number(value) * 100), "Revenue"]
                          : [Number(value).toLocaleString("en"), metric === "visitors" ? "Visitors" : "Pageviews"]
                      }
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
                      itemStyle={{ color: "var(--foreground)" }}
                    />
                    {hasRevenue && (
                      <Bar
                        yAxisId="revenue"
                        dataKey="revenue"
                        fill="var(--revenue)"
                        fillOpacity={0.75}
                        radius={[3, 3, 0, 0]}
                        maxBarSize={18}
                        isAnimationActive={false}
                      />
                    )}
                    <Area
                      yAxisId="count"
                      type="monotone"
                      dataKey={metric}
                      stroke="var(--brand)"
                      strokeWidth={2}
                      fill="url(#metricFill)"
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0, fill: "var(--brand)" }}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="size-full animate-pulse rounded-xl bg-muted/40" aria-hidden />
              )}
            </div>
          </section>

          <div className="grid gap-3 lg:grid-cols-2">
            <Panel
              title="Pages"
              action={
                <Segmented
                  value={pageTab}
                  onChange={setPageTab}
                  label="Page breakdown"
                  options={[
                    { value: "pages", label: "Top" },
                    { value: "entryPages", label: "Entry" },
                  ]}
                />
              }
            >
              <BarList
                rows={stats?.[pageTab]}
                loading={loading}
                empty="No page views in this period"
                renderLabel={(label) => <span className="font-mono text-[13px]">{label}</span>}
              />
            </Panel>

            <Panel
              title="Sources"
              action={
                <Segmented
                  value={sourceTab}
                  onChange={setSourceTab}
                  label="Source breakdown"
                  options={[
                    { value: "channels", label: "Channel" },
                    { value: "networks", label: "Social" },
                    { value: "referrers", label: "Site" },
                    { value: "campaigns", label: "Post" },
                  ]}
                />
              }
            >
              <BarList
                rows={stats?.[sourceTab]}
                loading={loading}
                empty={
                  sourceTab === "campaigns"
                    ? "No tagged posts yet. Share a tracked link to see what each post brings in."
                    : sourceTab === "networks"
                      ? "No readers from social networks in this period"
                      : "No visits in this period"
                }
                renderLabel={
                  sourceTab === "channels"
                    ? (label) => (
                        <span className="flex items-center gap-2">
                          <span className="size-2 rounded-full" style={{ background: channelColor(label) }} aria-hidden />
                          {label}
                        </span>
                      )
                    : undefined
                }
              />
              {siteDomain && (
                <p className="border-t border-border/60 px-2 pt-2.5 pb-1 text-xs text-muted-foreground">
                  Posting a story?{" "}
                  <button
                    type="button"
                    onClick={() => setLinking(true)}
                    className="font-medium text-brand-ink underline-offset-4 hover:underline"
                  >
                    Make a tracked link
                  </button>{" "}
                  to see what that post brings in.
                </p>
              )}
            </Panel>

            <Panel title="Goals">
              {loading ? (
                <BarList rows={undefined} loading empty="" />
              ) : stats && stats.goals.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-muted-foreground">
                      <th scope="col" className="px-2 py-1.5 font-normal">
                        Goal
                      </th>
                      <th scope="col" className="px-2 py-1.5 text-right font-normal">
                        Completions
                      </th>
                      <th scope="col" className="px-2 py-1.5 text-right font-normal">
                        Rate
                      </th>
                      <th scope="col" className="px-2 py-1.5 text-right font-normal">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {stats.goals.map((goal) => (
                      <tr key={goal.name} className="border-t border-border/60">
                        <td className="px-2 py-2 font-medium">{goal.name}</td>
                        <td className="px-2 py-2 text-right font-mono text-xs">{formatNumber(goal.completions)}</td>
                        <td className="px-2 py-2 text-right font-mono text-xs text-muted-foreground">
                          {stats.totals.visitors > 0
                            ? `${Math.round((Math.min(goal.visitors, stats.totals.visitors) / stats.totals.visitors) * 1000) / 10}%`
                            : "0%"}
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-xs text-revenue">
                          {goal.revenueCents > 0 ? formatMoney(goal.revenueCents) : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  <p>No goals tracked yet.</p>
                  <p className="mt-1">
                    Count signups and sales with one line of code.{" "}
                    <Link href="/docs#goals" className="text-foreground underline underline-offset-4">
                      See how
                    </Link>
                  </p>
                </div>
              )}
            </Panel>

            <Panel
              title="Locations"
              action={
                <Segmented
                  value={locationTab}
                  onChange={setLocationTab}
                  label="Location breakdown"
                  options={[
                    { value: "countries", label: "Country" },
                    { value: "cities", label: "City" },
                  ]}
                />
              }
            >
              <div className="grid items-center gap-2 sm:grid-cols-[150px_1fr]">
                <Globe points={realtime?.points ?? []} className="mx-auto hidden max-w-[150px] sm:block" />
                <BarList
                  rows={stats?.[locationTab].slice(0, 6)}
                  loading={loading}
                  empty="No location data yet"
                  renderLabel={(label) =>
                    locationTab === "countries" ? (
                      <span className="flex items-center gap-2">
                        <span aria-hidden>{countryFlag(label)}</span>
                        {countryName(label)}
                      </span>
                    ) : (
                      label
                    )
                  }
                />
              </div>
            </Panel>

            <Panel title="Devices" className="lg:col-span-2">
              <div className="grid gap-x-4 gap-y-2 md:grid-cols-3">
                {(
                  [
                    ["Type", stats?.devices],
                    ["Browser", stats?.browsers],
                    ["Operating system", stats?.systems],
                  ] as const
                ).map(([label, list]) => (
                  <div key={label}>
                    <h3 className="px-2 pt-1 pb-1.5 text-xs text-muted-foreground">{label}</h3>
                    <BarList rows={list?.slice(0, 5)} loading={loading} empty="No data yet" />
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          {funnelsUrl && <FunnelPanel url={funnelsUrl} query={query} canEdit={canEditFunnels} />}
          {visitorsUrl && <VisitorsPanel url={visitorsUrl} query={query} />}
          {siteDomain && <LinkBuilder open={linking} onOpenChange={setLinking} domain={siteDomain} />}
        </>
      )}
    </div>
  )
}
