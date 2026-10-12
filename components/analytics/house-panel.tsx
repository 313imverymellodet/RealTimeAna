"use client"

import { useMemo } from "react"
import { CHANNELS, channelColor } from "@/lib/channels"
import { countryName, formatNumber } from "@/lib/format"
import type { Realtime, Seat, Stats } from "@/lib/stats"

// House sizes: the room grows to the next size up as it fills
const HOUSE_SIZES = [40, 80, 160, 320, 640]

interface Position {
  x: number
  y: number
}

// Rows of seats fanned around a stage at the top, front row first
function layoutSeats(capacity: number): { seats: Position[]; height: number; radius: number } {
  const rows = capacity <= 40 ? 4 : capacity <= 80 ? 5 : capacity <= 160 ? 7 : capacity <= 320 ? 10 : 14
  const first = Math.max(Math.round((capacity / rows) * 0.7), 4)
  const step = (2 * (capacity - first * rows)) / (rows * (rows - 1))
  const spread = (50 * Math.PI) / 180
  const gap = 270 / (rows + 1.6)
  const seats: Position[] = []
  let radius = gap * 0.4

  for (let row = 0; row < rows && seats.length < capacity; row++) {
    const count = Math.min(Math.round(first + step * row), capacity - seats.length)
    const distance = gap * (row + 2)
    if (count > 1) radius = Math.min(radius, ((2 * spread * distance) / (count - 1)) * 0.42)
    for (let i = 0; i < count; i++) {
      const angle = count === 1 ? 0 : -spread + (2 * spread * i) / (count - 1)
      seats.push({ x: 300 + Math.sin(angle) * distance, y: 4 + Math.cos(angle) * distance })
    }
  }

  return { seats, height: 4 + gap * (rows + 1) + radius + 6, radius }
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
  const ordered = [...people].sort((x, y) => (x.id < y.id ? -1 : 1)).slice(0, capacity)
  for (const person of ordered) {
    let seat = hash(person.id) % capacity
    while (occupants.has(seat)) seat = (seat + 1) % capacity
    occupants.set(seat, person)
  }
  return occupants
}

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  return seconds < 60 ? "just now" : `${Math.floor(seconds / 60)}m ago`
}

function SeatMap({ people }: { people: Seat[] }) {
  const capacity = HOUSE_SIZES.find((size) => size >= people.length * 1.25) ?? HOUSE_SIZES[HOUSE_SIZES.length - 1]
  const layout = useMemo(() => layoutSeats(capacity), [capacity])
  const occupants = useMemo(() => seatPeople(people, capacity), [people, capacity])

  return (
    <svg
      viewBox={`0 0 600 ${layout.height}`}
      className="w-full"
      role="img"
      aria-label={`Seat map: ${people.length} of ${capacity} seats filled`}
    >
      {/* The stage */}
      <path d="M 215 10 Q 300 40 385 10" fill="none" stroke="var(--brand)" strokeWidth="6" strokeLinecap="round" />
      {layout.seats.map((seat, index) => {
        const occupant = occupants.get(index)
        return occupant ? (
          <circle
            key={`${index}-${occupant.id}`}
            cx={seat.x}
            cy={seat.y}
            r={layout.radius}
            fill={channelColor(occupant.channel)}
            // Keyed by person, so the pop-in plays only when someone new takes the seat
            className="seat-arrive"
          />
        ) : (
          <circle key={index} cx={seat.x} cy={seat.y} r={layout.radius} fill="var(--muted)" stroke="var(--border)" />
        )
      })}
    </svg>
  )
}

export function HousePanel({ realtime, stats }: { realtime: Realtime | null; stats: Stats | null }) {
  const people = useMemo(() => realtime?.seats ?? [], [realtime])
  const inHouse = realtime?.visitors ?? 0
  const nowShowing = realtime?.pages[0]
  const latest = realtime?.arrivals[0]

  const byChannel = useMemo(() => {
    const counts = new Map<string, number>()
    for (const person of people) counts.set(person.channel, (counts.get(person.channel) ?? 0) + 1)
    return CHANNELS.filter((channel) => counts.has(channel)).map((channel) => ({ channel, count: counts.get(channel)! }))
  }, [people])

  const record = stats?.record ?? null
  const today = stats?.today ?? 0
  const isRecordDay = record !== null && today >= record.visitors && today > 0
  const recordDay = record
    ? new Date(`${record.day}T12:00:00`).toLocaleDateString("en", { month: "short", day: "numeric" })
    : ""

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
      {/* Marquee */}
      <div className="marquee flex items-center justify-between gap-4 px-5 py-2.5 text-xs">
        <p className="min-w-0 truncate">
          <span className="font-semibold tracking-[0.14em] text-brand-ink uppercase">Now showing</span>
          {nowShowing ? (
            <>
              <span className="mx-2 font-mono text-[13px] text-foreground">
                {nowShowing.label === "/" ? "Front page" : nowShowing.label}
              </span>
              <span className="text-muted-foreground">
                {nowShowing.visitors} {nowShowing.visitors === 1 ? "reader" : "readers"}
              </span>
            </>
          ) : (
            <span className="ml-2 text-muted-foreground">The house is quiet right now</span>
          )}
        </p>
        {isRecordDay && (
          <span className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 font-semibold text-brand-foreground">
            Full house: record day
          </span>
        )}
      </div>

      <div className="grid items-center gap-6 p-5 lg:grid-cols-[1.5fr_1fr]">
        <SeatMap people={people} />

        <div>
          <p className="tabular text-6xl font-semibold tracking-tight">{formatNumber(inHouse)}</p>
          <p className="mt-1 text-sm text-muted-foreground">in the house right now</p>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs" aria-label="Readers by channel">
            {byChannel.map(({ channel, count }) => (
              <li key={channel} className="flex items-center gap-1.5">
                <span className="size-2 rounded-full" style={{ background: channelColor(channel) }} aria-hidden />
                {channel}
                <span className="tabular font-mono text-muted-foreground">{count}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 min-h-10 rounded-2xl bg-muted px-3.5 py-2.5 text-sm" aria-live="polite">
            {latest ? (
              <p key={latest.at} className="arrival">
                <span className="mr-2 inline-block size-2 rounded-full" style={{ background: channelColor(latest.channel) }} aria-hidden />
                A reader walked in from <span className="font-medium">{latest.source || latest.channel}</span>
                {latest.city || latest.country
                  ? ` · ${latest.city || countryName(latest.country || "")}`
                  : ""}
                <span className="ml-2 text-xs text-muted-foreground">{timeAgo(latest.at)}</span>
              </p>
            ) : (
              <p className="text-muted-foreground">Waiting for the next reader to walk in.</p>
            )}
          </div>

          {record && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-muted-foreground">Today vs house record</span>
                <span className="tabular font-mono">
                  {formatNumber(today)} / {formatNumber(record.visitors)}
                  <span className="ml-1.5 text-muted-foreground">({recordDay})</span>
                </span>
              </div>
              <div
                className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label="Today's readers compared with the busiest day"
                aria-valuemin={0}
                aria-valuemax={record.visitors}
                aria-valuenow={Math.min(today, record.visitors)}
              >
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.min((today / Math.max(record.visitors, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
