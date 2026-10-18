"use client"

import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { formatMoney, formatNumber } from "@/lib/format"

export interface ChartPoint {
  t: string
  visitors: number
  pageviews: number
  // Revenue in whole currency units
  revenue: number
  // Per-site values for stacked charts, keyed by StackedSeries.key
  [key: string]: number | string
}

export interface StackedSeries {
  key: string
  label: string
  color: string
}

export function formatTick(t: string, unit: "hour" | "day") {
  const date = new Date(t)
  return unit === "hour"
    ? date.toLocaleTimeString(undefined, { hour: "numeric" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

// Traffic as an area (one total, or one stacked band per site) with revenue as bars
export function MetricsChart({
  series,
  unit,
  metric,
  stacks,
}: {
  series: ChartPoint[] | null
  unit: "hour" | "day"
  metric: "visitors" | "pageviews"
  stacks?: StackedSeries[]
}) {
  const hasRevenue = Boolean(series?.some((point) => point.revenue > 0))
  const metricLabel = metric === "visitors" ? "Visitors" : "Pageviews"
  const labels = new Map((stacks ?? []).map((stack) => [stack.key, stack.label]))
  const revenueBars = (
    <Bar
      yAxisId="revenue"
      dataKey="revenue"
      fill="var(--revenue)"
      fillOpacity={stacks ? 0.9 : 0.75}
      radius={[3, 3, 0, 0]}
      maxBarSize={stacks ? 12 : 18}
      isAnimationActive={false}
    />
  )

  return (
    <>
      {(hasRevenue || stacks) && (
        <p className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {stacks ? (
            stacks.map((stack) => (
              <span key={stack.key} className="flex items-center gap-1.5">
                <span className="size-2 rounded-sm" style={{ background: stack.color }} />
                {stack.label}
              </span>
            ))
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-3 rounded bg-brand" />
              {metricLabel}
            </span>
          )}
          {hasRevenue && (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-revenue" />
              Revenue
            </span>
          )}
        </p>
      )}
      <div className="h-64 sm:h-72">
        {series ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={series} margin={{ top: 8, right: hasRevenue ? 0 : 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="t"
                tickFormatter={(t: string) => formatTick(t, unit)}
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
                labelFormatter={(t) => formatTick(String(t), unit)}
                formatter={(value, name) =>
                  name === "revenue"
                    ? [formatMoney(Number(value) * 100), "Revenue"]
                    : [Number(value).toLocaleString(), labels.get(String(name)) ?? metricLabel]
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
              {/* Behind a single line, but on top of stacked bands so they keep their colour */}
              {hasRevenue && !stacks && revenueBars}
              {stacks ? (
                stacks.map((stack) => (
                  <Area
                    key={stack.key}
                    yAxisId="count"
                    type="monotone"
                    dataKey={stack.key}
                    stackId="sites"
                    stroke={stack.color}
                    strokeWidth={1.5}
                    fill={stack.color}
                    fillOpacity={0.35}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0, fill: stack.color }}
                    isAnimationActive={false}
                  />
                ))
              ) : (
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
              )}
              {hasRevenue && stacks && revenueBars}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="size-full animate-pulse rounded-xl bg-muted/40" aria-hidden />
        )}
      </div>
    </>
  )
}
