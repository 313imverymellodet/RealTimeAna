"use client"

import { useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { LiveDot } from "@/components/brand"
import { Globe } from "@/components/globe"
import { channelColor } from "@/lib/channels"
import { countryFlag, countryName, formatDuration, formatMoney, formatNumber, percentChange } from "@/lib/format"
import type { BreakdownRow, RangeKey, Realtime, Stats } from "@/lib/stats"
import { FunnelPanel } from "./funnel-panel"
import { HousePanel } from "./house-panel"
import { LinkBuilder } from "./link-builder"
import { MetricsChart } from "./metrics-chart"
import { SocialPanel } from "./social-panel"
import { StatTile } from "./stat-tile"
import { StoriesPanel, TrendingPanel } from "./stories-panels"
import { Panel, Segmented } from "./primitives"
import { usePolling } from "./use-polling"
import { useQueryParam } from "./use-query-param"
import { VisitorsPanel } from "./visitors-panel"

export const RANGE_KEYS: RangeKey[] = ["today", "7d", "30d", "90d"]

export const RANGE_OPTIONS: { value: RangeKey; label: string }[] = [
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
  // Connected Bluesky / Mastodon accounts; `canEditSocial` adds connect and disconnect
  socialUrl?: string
  canEditSocial?: boolean
  // Keep the date range in the address bar (off for embedded previews)
  syncUrl?: boolean
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
  socialUrl,
  canEditSocial = false,
  syncUrl = true,
}: DashboardViewProps) {
  const [urlRange, setUrlRange] = useQueryParam<RangeKey>("range", "7d", RANGE_KEYS)
  const [localRange, setLocalRange] = useState<RangeKey>("7d")
  const range = syncUrl ? urlRange : localRange
  const setRange = syncUrl ? setUrlRange : setLocalRange
  const [metric, setMetric] = useState<Metric>("visitors")
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
            <MetricsChart series={stats?.series ?? null} unit={stats?.unit ?? "day"} metric={metric} />
          </section>

          <div className="grid gap-3 lg:grid-cols-2">
            <TrendingPanel trending={realtime?.trending} loading={realtime === null} />

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

            <StoriesPanel
              stories={stats?.stories}
              entryPages={stats?.entryPages}
              loading={loading}
              entryList={(rows) => (
                <BarList
                  rows={rows}
                  loading={loading}
                  empty="No page views in this period"
                  renderLabel={(label) => <span className="font-mono text-[13px]">{label}</span>}
                />
              )}
            />

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

          {socialUrl && <SocialPanel url={socialUrl} canEdit={canEditSocial} />}
          {funnelsUrl && <FunnelPanel url={funnelsUrl} query={query} canEdit={canEditFunnels} />}
          {visitorsUrl && <VisitorsPanel url={visitorsUrl} query={query} />}
          {siteDomain && <LinkBuilder open={linking} onOpenChange={setLinking} domain={siteDomain} />}
        </>
      )}
    </div>
  )
}
