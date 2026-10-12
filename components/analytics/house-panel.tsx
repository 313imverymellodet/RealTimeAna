"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { LiveDot } from "@/components/brand"
import { CHANNELS, channelColor } from "@/lib/channels"
import { countryName, formatNumber } from "@/lib/format"
import type { Realtime, Seat, Stats } from "@/lib/stats"

// ---------------------------------------------------------------------------
// The auditorium
//
// Drawn as a floor plan: a stage with footlights at the top, and curved rows
// of seats fanning out below it in three sections split by two aisles. Every
// row is an arc around one point far above the stage, so the rows bend gently
// toward it the way a real house does.
// ---------------------------------------------------------------------------

const WIDTH = 720
const CENTER_X = WIDTH / 2
const CENTER_Y = -430
const STAGE_RADIUS = 512
const FIRST_ROW_RADIUS = 566
const LAST_ROW_RADIUS = 806
const HALF_ANGLE = (21 * Math.PI) / 180
const AISLE_AT = HALF_ANGLE * 0.36
// The room is rebuilt one size up as it fills, so it never looks packed or deserted
const HOUSE_SIZES = [90, 160, 300, 560]

interface Chair {
  x: number
  y: number
  // Degrees to turn the chair so it faces the stage
  turn: number
}

interface Floor {
  chairs: Chair[]
  pitch: number
  height: number
}

function point(radius: number, angle: number) {
  return { x: CENTER_X + Math.sin(angle) * radius, y: CENTER_Y + Math.cos(angle) * radius }
}

function rowsFor(pitch: number) {
  const rows: number[] = []
  for (let radius = FIRST_ROW_RADIUS; radius <= LAST_ROW_RADIUS; radius += pitch * 1.08) rows.push(radius)
  return rows
}

function chairsInRow(radius: number, pitch: number): Chair[] {
  const step = pitch / radius
  const aisle = (pitch * 0.62) / radius
  const sections: [number, number][] = [
    [-HALF_ANGLE, -AISLE_AT - aisle],
    [-AISLE_AT + aisle, AISLE_AT - aisle],
    [AISLE_AT + aisle, HALF_ANGLE],
  ]
  const chairs: Chair[] = []
  for (const [from, to] of sections) {
    const count = Math.max(Math.floor((to - from) / step + 0.2), 1)
    const start = (from + to) / 2 - ((count - 1) / 2) * step
    for (let i = 0; i < count; i++) {
      const angle = start + i * step
      chairs.push({ ...point(radius, angle), turn: (-angle * 180) / Math.PI })
    }
  }
  return chairs
}

// Largest chairs that still give the room at least `target` seats
function buildFloor(target: number): Floor {
  for (let pitch = 46; pitch >= 9; pitch -= 1) {
    const chairs = rowsFor(pitch).flatMap((radius) => chairsInRow(radius, pitch))
    if (chairs.length >= target || pitch === 9) {
      const lowest = Math.max(...chairs.map((chair) => chair.y))
      return { chairs, pitch, height: lowest + pitch * 0.6 + 10 }
    }
  }
  return { chairs: [], pitch: 9, height: 400 }
}

function hash(text: string) {
  let value = 0
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) >>> 0
  return value
}

// Each person's seat comes from their id, so they stay put between refreshes.
// Two people wanting the same seat are settled in id order, which is also stable.
function seatPeople(people: Seat[], capacity: number) {
  const occupants = new Map<number, Seat>()
  if (capacity === 0) return occupants
  const ordered = [...people].sort((x, y) => (x.id < y.id ? -1 : 1)).slice(0, capacity)
  for (const person of ordered) {
    let seat = hash(person.id) % capacity
    while (occupants.has(seat)) seat = (seat + 1) % capacity
    occupants.set(seat, person)
  }
  return occupants
}

function pageName(path: string) {
  return path === "/" ? "Front page" : path
}

function clip(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

function seatLabel(person: Seat) {
  const from = person.source || person.channel
  const where = person.country ? ` in ${countryName(person.country)}` : ""
  return `Reader from ${from}${where}, reading ${pageName(person.path)}`
}

// Points along an arc of the shared circle, as an SVG path fragment
function arc(radius: number, from: number, to: number, steps = 24) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const p = point(radius, from + ((to - from) * i) / steps)
    return `${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  }).join(" L ")
}

function Auditorium({ people, showing }: { people: Seat[]; showing: { label: string; visitors: number } | undefined }) {
  const target = HOUSE_SIZES.find((size) => size >= people.length * 1.6) ?? HOUSE_SIZES[HOUSE_SIZES.length - 1]
  const floor = useMemo(() => buildFloor(target), [target])
  const occupants = useMemo(() => seatPeople(people, floor.chairs.length), [people, floor])

  const chairWidth = floor.pitch * 0.8
  const chairDepth = floor.pitch * 0.74
  const stageEdge = (15.5 * Math.PI) / 180
  const stageLeft = point(STAGE_RADIUS, -stageEdge)
  const stageRight = point(STAGE_RADIUS, stageEdge)
  const footlights = Array.from({ length: 15 }, (_, i) => point(STAGE_RADIUS + 9, -stageEdge + (2 * stageEdge * i) / 14))

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${Math.round(floor.height)}`}
      className="w-full"
      role="img"
      aria-label={`Seat map: ${people.length} of ${floor.chairs.length} seats filled`}
    >
      <defs>
        <radialGradient id="spotlight" cx="50%" cy="6%" r="48%" fx="50%" fy="0%">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.2" />
          <stop offset="55%" stopColor="var(--brand)" stopOpacity="0.05" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="stage" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff8ea" />
          <stop offset="100%" stopColor="#ffeccb" />
        </linearGradient>
      </defs>

      {/* Light spilling from the stage over the front rows */}
      <rect width={WIDTH} height={floor.height} fill="url(#spotlight)" />

      {/* The stage, with the story that is on right now */}
      <path
        d={`M ${stageLeft.x - 16} 6 L ${stageRight.x + 16} 6 L ${arc(STAGE_RADIUS, stageEdge, -stageEdge)} Z`}
        fill="url(#stage)"
        stroke="var(--brand)"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <text
        x={CENTER_X}
        y="33"
        textAnchor="middle"
        fontSize="11"
        fontWeight="600"
        letterSpacing="2.6"
        fill="var(--brand-ink)"
      >
        NOW SHOWING
      </text>
      <text x={CENTER_X} y="59" textAnchor="middle" fontSize="19" fontWeight="600" fill="var(--foreground)">
        {showing ? clip(pageName(showing.label), 30) : "Intermission"}
      </text>
      {footlights.map((light, index) => (
        <circle
          key={index}
          cx={light.x}
          cy={light.y}
          r="3.2"
          fill="var(--brand)"
          className="footlight"
          style={{ animationDelay: `${(index % 5) * 0.35}s` }}
        />
      ))}

      {/* The seats */}
      {floor.chairs.map((chair, index) => {
        const person = occupants.get(index)
        const color = person ? channelColor(person.channel) : null
        return (
          <g key={person ? `${index}-${person.id}` : index} transform={`translate(${chair.x.toFixed(1)} ${chair.y.toFixed(1)}) rotate(${chair.turn.toFixed(1)})`}>
            {person && color ? (
              <>
                <circle r={chairWidth * 0.5} fill="none" stroke={color} strokeWidth="2" className="seat-ripple" />
                <rect
                  x={-chairWidth / 2}
                  y={-chairDepth / 2}
                  width={chairWidth}
                  height={chairDepth}
                  rx={floor.pitch * 0.24}
                  fill={color}
                  className="seat-arrive"
                  style={{ filter: `drop-shadow(0 ${(floor.pitch * 0.06).toFixed(1)}px ${(floor.pitch * 0.14).toFixed(1)}px ${color}66)` }}
                >
                  <title>{seatLabel(person)}</title>
                </rect>
                {/* Chair back, on the side away from the stage */}
                <rect
                  x={-chairWidth / 2}
                  y={chairDepth / 2 - chairDepth * 0.26}
                  width={chairWidth}
                  height={chairDepth * 0.26}
                  rx={floor.pitch * 0.12}
                  fill="#000000"
                  fillOpacity="0.18"
                  pointerEvents="none"
                />
              </>
            ) : (
              <rect
                x={-chairWidth / 2}
                y={-chairDepth / 2}
                width={chairWidth}
                height={chairDepth}
                rx={floor.pitch * 0.24}
                fill="#ffffff"
                stroke="var(--input)"
                strokeWidth="1"
              />
            )}
            {!person && (
              <line
                x1={-chairWidth / 2 + 2}
                x2={chairWidth / 2 - 2}
                y1={chairDepth / 2 - chairDepth * 0.24}
                y2={chairDepth / 2 - chairDepth * 0.24}
                stroke="var(--input)"
                strokeWidth="1"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// The numbers beside it
// ---------------------------------------------------------------------------

// Eases the displayed number toward a new value instead of jumping
function useCountUp(value: number) {
  const [shown, setShown] = useState(value)
  const shownRef = useRef(value)

  useEffect(() => {
    const from = shownRef.current
    if (from === value) return

    const started = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = Math.min((now - started) / 600, 1)
      const next = Math.round(from + (value - from) * (1 - (1 - progress) ** 3))
      shownRef.current = next
      setShown(next)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return shown
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  return seconds < 60 ? "just now" : `${Math.floor(seconds / 60)}m ago`
}

export function HousePanel({ realtime, stats }: { realtime: Realtime | null; stats: Stats | null }) {
  const people = useMemo(() => realtime?.seats ?? [], [realtime])
  const inHouse = useCountUp(realtime?.visitors ?? 0)
  const showing = realtime?.pages[0]
  const arrivals = realtime?.arrivals.slice(0, 3) ?? []

  const byChannel = useMemo(() => {
    const counts = new Map<string, number>()
    for (const person of people) counts.set(person.channel, (counts.get(person.channel) ?? 0) + 1)
    return CHANNELS.filter((channel) => counts.has(channel)).map((channel) => ({ channel, count: counts.get(channel)! }))
  }, [people])

  const record = stats?.record ?? null
  const today = stats?.today ?? 0
  const isRecordDay = record !== null && today >= record.visitors && today > 0
  const toGo = record ? Math.max(record.visitors - today, 0) : 0
  const recordDay = record
    ? new Date(`${record.day}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })
    : ""

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
      <div className="grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-center px-3 pt-4 pb-4 sm:px-6 sm:pt-6">
          <Auditorium people={people} showing={showing} />
        </div>

        <div className="flex flex-col gap-6 border-t border-border/70 p-6 lg:border-t-0 lg:border-l">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
              <LiveDot />
              In the house
            </p>
            <p className="tabular mt-2 text-7xl leading-none font-semibold tracking-tighter">{formatNumber(inHouse)}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {showing
                ? `${showing.visitors} on ${clip(pageName(showing.label), 28)} right now`
                : "Nobody is reading right now"}
            </p>
          </div>

          {byChannel.length > 0 && (
            <div>
              <div className="flex h-2 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                {byChannel.map(({ channel, count }) => (
                  <span
                    key={channel}
                    className="h-full rounded-full transition-[flex-grow] duration-700"
                    style={{ flexGrow: count, background: channelColor(channel) }}
                  />
                ))}
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm" aria-label="Readers by channel">
                {byChannel.map(({ channel, count }) => (
                  <li key={channel} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-[3px]" style={{ background: channelColor(channel) }} aria-hidden />
                      {channel}
                    </span>
                    <span className="tabular font-mono text-xs text-muted-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div aria-live="polite">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">At the door</p>
            {arrivals.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {arrivals.map((arrival, index) => (
                  <li
                    key={arrival.at}
                    className={`arrival flex items-center gap-2.5 text-sm ${index > 0 ? "text-muted-foreground" : ""}`}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ background: channelColor(arrival.channel) }}
                      aria-hidden
                    />
                    <span className="min-w-0 truncate">
                      <span className={index === 0 ? "font-medium" : ""}>{arrival.source || arrival.channel}</span>
                      {arrival.city || arrival.country ? ` · ${arrival.city || countryName(arrival.country || "")}` : ""}
                    </span>
                    <span className="tabular ml-auto shrink-0 font-mono text-[11px] text-muted-foreground">
                      {timeAgo(arrival.at)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Waiting for the next reader to walk in.</p>
            )}
          </div>

          {record && (
            <div className="ticket mt-auto rounded-2xl bg-muted px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-brand-ink uppercase">
                  {isRecordDay ? "New house record" : "House record"}
                </p>
                <p className="tabular font-mono text-xs text-muted-foreground">{recordDay}</p>
              </div>
              <p className="tabular mt-1 text-2xl font-semibold tracking-tight">
                {formatNumber(record.visitors)}
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">readers in a day</span>
              </p>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-background"
                role="progressbar"
                aria-label="Today's readers compared with the busiest day"
                aria-valuemin={0}
                aria-valuemax={record.visitors}
                aria-valuenow={Math.min(today, record.visitors)}
              >
                <div
                  className="h-full rounded-full bg-brand transition-[width] duration-700"
                  style={{ width: `${Math.min((today / Math.max(record.visitors, 1)) * 100, 100)}%` }}
                />
              </div>
              <p className="tabular mt-2 text-xs text-muted-foreground">
                {isRecordDay
                  ? `Full house. ${formatNumber(today)} today and counting.`
                  : `${formatNumber(today)} today. ${formatNumber(toGo)} more to beat it.`}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
