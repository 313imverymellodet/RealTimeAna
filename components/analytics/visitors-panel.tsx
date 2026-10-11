"use client"

import { FileText, Target, UserCheck } from "lucide-react"
import { useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { countryFlag, countryName, formatDuration, formatMoney } from "@/lib/format"
import type { JourneyStep, VisitorSummary } from "@/lib/journeys"
import { visitorColor, visitorNickname } from "@/lib/nickname"
import { Panel } from "./primitives"
import { usePolling } from "./use-polling"

const visitorsDelay = () => 20_000
const journeyDelay = () => 20_000

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`
  return new Date(iso).toLocaleDateString("en", { month: "short", day: "numeric" })
}

// Time of day for today's steps; date and time for earlier ones
function stepTime(iso: string) {
  const date = new Date(iso)
  const time = date.toLocaleTimeString("en", { hour: "numeric", minute: "2-digit" })
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString("en", { month: "short", day: "numeric" })}, ${time}`
}

function Avatar({ id }: { id: string }) {
  const color = visitorColor(id)
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: `${color}26`, color }}
    >
      {visitorNickname(id)
        .split(" ")
        .map((word) => word[0])
        .join("")}
    </span>
  )
}

function place(visitor: VisitorSummary) {
  if (!visitor.country) return "Unknown location"
  return visitor.city ? `${visitor.city}, ${countryName(visitor.country)}` : countryName(visitor.country)
}

function Journey({ url, visitor }: { url: string; visitor: VisitorSummary }) {
  const { data: steps, loading } = usePolling<JourneyStep[]>(`${url}/${visitor.id}`, journeyDelay)

  return (
    <div className="space-y-5 px-4 pb-6">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-border bg-card/60 p-4 text-sm">
        {[
          ["Location", `${visitor.country ? countryFlag(visitor.country) : "🌐"} ${place(visitor)}`],
          ["Device", [visitor.device, visitor.browser, visitor.os].filter(Boolean).join(" · ") || "Unknown"],
          ["Source", visitor.referrer || "Direct / none"],
          ["Campaign", visitor.campaign || "None"],
          ["Time on site", formatDuration(visitor.seconds)],
          ["Revenue", visitor.revenueCents > 0 ? formatMoney(visitor.revenueCents) : "None"],
        ].map(([term, detail]) => (
          <div key={term} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{term}</dt>
            <dd className="mt-0.5 truncate">{detail}</dd>
          </div>
        ))}
      </dl>

      {loading ? (
        <div className="space-y-2" aria-hidden>
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-10 animate-pulse rounded-md bg-muted/60" />
          ))}
        </div>
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-5">
          {(steps ?? []).map((step, index) => (
            <li key={`${step.at}-${index}`} className="relative">
              <span
                aria-hidden
                className={`absolute top-0.5 -left-[29px] flex size-[18px] items-center justify-center rounded-full border border-border bg-background ${
                  step.kind === "goal" ? "text-revenue" : "text-muted-foreground"
                }`}
              >
                {step.kind === "goal" ? <Target className="size-2.5" /> : <FileText className="size-2.5" />}
              </span>
              <p className="flex items-baseline justify-between gap-3 text-sm">
                {step.kind === "goal" ? (
                  <span className="min-w-0 truncate font-medium">
                    Completed <span className="text-revenue">{step.label}</span>
                    {step.revenueCents ? ` · ${formatMoney(step.revenueCents)}` : ""}
                  </span>
                ) : (
                  <span className="min-w-0 truncate font-mono text-[13px]">{step.label}</span>
                )}
                <time dateTime={step.at} className="tabular shrink-0 font-mono text-xs text-muted-foreground">
                  {stepTime(step.at)}
                </time>
              </p>
              {step.kind === "page" && step.seconds ? (
                <p className="mt-0.5 text-xs text-muted-foreground">Stayed {formatDuration(step.seconds)}</p>
              ) : null}
            </li>
          ))}
          {steps && steps.length === 0 && <li className="text-sm text-muted-foreground">No activity recorded.</li>}
        </ol>
      )}
    </div>
  )
}

export function VisitorsPanel({ url, query }: { url: string; query: string }) {
  const { data: visitors, loading } = usePolling<VisitorSummary[]>(`${url}${query}`, visitorsDelay)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = visitors?.find((visitor) => visitor.id === openId) ?? null

  return (
    <>
      <Panel title="Visitor journeys">
        {loading ? (
          <div className="space-y-2 p-2" aria-hidden>
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-12 animate-pulse rounded-md bg-muted/60" />
            ))}
          </div>
        ) : visitors && visitors.length > 0 ? (
          <ul>
            {visitors.map((visitor) => (
              <li key={visitor.id}>
                <button
                  type="button"
                  onClick={() => setOpenId(visitor.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <Avatar id={visitor.id} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <span className="truncate">{visitorNickname(visitor.id)}</span>
                      {visitor.identified && (
                        <span className="flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] font-normal text-muted-foreground">
                          <UserCheck className="size-3" aria-hidden />
                          Signed in
                        </span>
                      )}
                      {visitor.revenueCents > 0 ? (
                        <span className="tabular shrink-0 rounded-full bg-revenue/15 px-2 py-0.5 font-mono text-[11px] text-revenue">
                          {formatMoney(visitor.revenueCents)}
                        </span>
                      ) : visitor.goals > 0 ? (
                        <span className="shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-[11px] text-brand">
                          Converted
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {visitor.country ? `${countryFlag(visitor.country)} ` : ""}
                      {place(visitor)} · {visitor.referrer || "Direct"} · entered on{" "}
                      <span className="font-mono">{visitor.entryPage}</span>
                    </span>
                  </span>
                  <span className="tabular hidden shrink-0 text-right text-xs text-muted-foreground sm:block">
                    {visitor.pageviews} {visitor.pageviews === 1 ? "page" : "pages"}
                    <span className="block">{timeAgo(visitor.lastSeen)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-2 py-8 text-center text-sm text-muted-foreground">No visitors in this period.</p>
        )}
        <p className="border-t border-border/60 px-2 pt-2.5 pb-1 text-xs text-muted-foreground">
          Names are random labels. Anonymous visitors are recognised for one day; signed-in users you identify are
          followed across days.
        </p>
      </Panel>

      <Sheet open={open !== null} onOpenChange={(isOpen) => !isOpen && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {open && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar id={open.id} />
                  {visitorNickname(open.id)}
                </SheetTitle>
                <SheetDescription>
                  {open.pageviews} {open.pageviews === 1 ? "page" : "pages"}
                  {open.goals > 0 ? `, ${open.goals} ${open.goals === 1 ? "goal" : "goals"}` : ""} · last seen{" "}
                  {timeAgo(open.lastSeen)}
                  {open.identified ? " · signed-in user, all visits shown" : ""}
                </SheetDescription>
              </SheetHeader>
              <Journey url={url} visitor={open} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
