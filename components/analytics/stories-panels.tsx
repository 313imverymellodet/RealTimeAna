"use client"

import { ArrowUpRight } from "lucide-react"
import { useState } from "react"
import { formatDuration, formatNumber } from "@/lib/format"
import type { BreakdownRow, StoryRow, TrendingStory } from "@/lib/stats"
import { cn } from "@/lib/utils"
import { Panel, Segmented } from "./primitives"

function storyName(path: string) {
  return path === "/" ? "Front page" : path
}

// A small area chart of the last 30 minutes
function Sparkline({ values, rising }: { values: number[]; rising: boolean }) {
  const width = 84
  const height = 26
  const max = Math.max(...values, 1)
  const step = width / Math.max(values.length - 1, 1)
  const points = values.map((value, i) => [i * step, height - 2 - (value / max) * (height - 4)] as const)
  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")
  const color = rising ? "var(--brand)" : "var(--muted-foreground)"

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-[26px] w-[84px] shrink-0" aria-hidden>
      <path d={`${line} L ${width} ${height} L 0 ${height} Z`} fill={color} fillOpacity={rising ? 0.16 : 0.08} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={points[points.length - 1][0]} cy={points[points.length - 1][1]} r="2.2" fill={color} />
    </svg>
  )
}

export function TrendingPanel({ trending, loading }: { trending: TrendingStory[] | undefined; loading: boolean }) {
  return (
    <Panel title="Top stories right now" action={<span className="text-xs text-muted-foreground">Last 30 minutes</span>}>
      {loading ? (
        <div className="space-y-1.5 p-2" aria-hidden>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-11 animate-pulse rounded-md bg-muted/60" />
          ))}
        </div>
      ) : trending && trending.length > 0 ? (
        <ol>
          {trending.map((story, index) => (
            <li
              key={story.path}
              className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-muted/60"
            >
              <span className="tabular w-5 shrink-0 text-center text-lg font-semibold text-muted-foreground/60">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-mono text-[13px]">{storyName(story.path)}</span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  {story.recent} {story.recent === 1 ? "reader" : "readers"} in 30 min
                  {story.rising && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-brand/15 px-1.5 py-px font-medium text-brand-ink">
                      <ArrowUpRight className="size-3" aria-hidden />
                      Rising
                    </span>
                  )}
                </span>
              </span>
              <Sparkline values={story.spark} rising={story.rising} />
              <span className="w-12 shrink-0 text-right">
                <span className="tabular block text-lg leading-none font-semibold">{story.now}</span>
                <span className="text-[11px] text-muted-foreground">now</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-2 py-10 text-center text-sm text-muted-foreground">Nobody has read anything in the last 30 minutes.</p>
      )}
    </Panel>
  )
}

function DepthBar({ depth }: { depth: number | null }) {
  if (depth === null) return <span className="text-xs text-muted-foreground">Not yet</span>
  return (
    <span className="flex items-center justify-end gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
        <span className="block h-full rounded-full bg-brand" style={{ width: `${depth}%` }} />
      </span>
      <span className="tabular w-9 text-right font-mono text-xs">{depth}%</span>
    </span>
  )
}

export function StoriesPanel({
  stories,
  entryPages,
  loading,
  entryList,
}: {
  stories: StoryRow[] | undefined
  entryPages: BreakdownRow[] | undefined
  loading: boolean
  // Renders the entry-page list with the dashboard's shared bar list
  entryList: (rows: BreakdownRow[] | undefined) => React.ReactNode
}) {
  const [view, setView] = useState<"stories" | "entry">("stories")
  const hasDepth = Boolean(stories?.some((story) => story.depth !== null))

  return (
    <Panel
      title="Stories"
      className="lg:col-span-2"
      action={
        <Segmented
          value={view}
          onChange={setView}
          label="Stories view"
          options={[
            { value: "stories", label: "Read" },
            { value: "entry", label: "Entry" },
          ]}
        />
      }
    >
      {view === "entry" ? (
        entryList(entryPages)
      ) : loading ? (
        <div className="space-y-1.5 p-2" aria-hidden>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-9 animate-pulse rounded-md bg-muted/60" />
          ))}
        </div>
      ) : stories && stories.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th scope="col" className="px-2 py-1.5 font-normal">
                  Story
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-normal">
                  Readers
                </th>
                <th scope="col" className="hidden px-2 py-1.5 text-right font-normal sm:table-cell">
                  Views
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-normal">
                  Avg. time
                </th>
                <th scope="col" className="px-2 py-1.5 text-right font-normal">
                  Read depth
                </th>
                <th scope="col" className="hidden px-2 py-1.5 text-right font-normal md:table-cell">
                  Read to the end
                </th>
              </tr>
            </thead>
            <tbody className="tabular">
              {stories.map((story) => (
                <tr key={story.path} className="border-t border-border/60">
                  <td className="max-w-[16rem] truncate px-2 py-2 font-mono text-[13px]">{storyName(story.path)}</td>
                  <td className="px-2 py-2 text-right font-mono text-xs">{formatNumber(story.readers)}</td>
                  <td className="hidden px-2 py-2 text-right font-mono text-xs text-muted-foreground sm:table-cell">
                    {formatNumber(story.views)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono text-xs">
                    {story.avgSeconds > 0 ? formatDuration(story.avgSeconds) : "–"}
                  </td>
                  <td className="px-2 py-2">
                    <DepthBar depth={story.depth} />
                  </td>
                  <td
                    className={cn(
                      "hidden px-2 py-2 text-right font-mono text-xs md:table-cell",
                      story.finished !== null && story.finished >= 50 && "text-success",
                    )}
                  >
                    {story.finished === null ? "–" : `${story.finished}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!hasDepth && (
            <p className="border-t border-border/60 px-2 pt-2.5 pb-1 text-xs text-muted-foreground">
              Read depth appears as readers scroll, once your site is using the latest tracking script.
            </p>
          )}
        </div>
      ) : (
        <p className="px-2 py-8 text-center text-sm text-muted-foreground">No page views in this period</p>
      )}
    </Panel>
  )
}
