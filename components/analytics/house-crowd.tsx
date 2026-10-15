"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import { CENTER_X, facing, LOBBY, WIDTH, type Facing, type Floor, type Waypoint } from "@/lib/auditorium"

// The little people of the house: readers who walk in through the lobby and up
// the aisle to their seat (or back out when they leave), and the usher at the
// doors who waves a flashlight for each arrival. Drawn as sprite sheets
// rendered in Blender (art/build_sprites.py) on a layer over the seat map.

const SPEED = 95 // seat-map units per second: a stroll, so you can watch them find their seat
const FRAME_SECONDS = 0.11
const SHEET_ROWS: Record<Facing, number> = { up: 0, right: 1, down: 2, left: 3 }
const SPRITE_CHANNELS: Record<string, string> = {
  Search: "search",
  Social: "social",
  Newsletter: "newsletter",
  Paid: "paid",
  Referral: "referral",
  Direct: "direct",
}
// Walking in and out at once looks busy; past this many, people just appear
export const MAX_WALKERS = 14

export interface WalkerPlan {
  key: string
  personId: string
  channel: string
  kind: "arrive" | "leave"
  route: Waypoint[]
}

function query() {
  return window.matchMedia("(prefers-reduced-motion: reduce)")
}

export function useReducedMotion() {
  return useSyncExternalStore(
    (notify) => {
      const media = query()
      media.addEventListener("change", notify)
      return () => media.removeEventListener("change", notify)
    },
    () => query().matches,
    () => false,
  )
}

function spriteFor(channel: string) {
  return `/sprites/reader-${SPRITE_CHANNELS[channel] ?? "referral"}.webp`
}

function Walker({
  plan,
  scale,
  size,
  onDone,
}: {
  plan: WalkerPlan
  scale: React.RefObject<number>
  size: number
  onDone: (key: string) => void
}) {
  const element = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = element.current
    if (!node) return

    const route = plan.route
    const lengths = route.slice(1).map((to, i) => Math.hypot(to.x - route[i].x, to.y - route[i].y))
    const total = lengths.reduce((sum, length) => sum + length, 0)
    const started = performance.now()
    let frame = 0

    const place = (spot: Waypoint, direction: Facing, step: number) => {
      const px = scale.current * size
      node.style.width = node.style.height = `${px}px`
      node.style.transform = `translate3d(${spot.x * scale.current - px / 2}px, ${spot.y * scale.current - px * 0.84}px, 0)`
      node.style.backgroundPosition = `${(step / 7) * 100}% ${(SHEET_ROWS[direction] / 3) * 100}%`
    }

    const tick = (now: number) => {
      const seconds = (now - started) / 1000
      let travelled = Math.min(seconds * SPEED, total)
      let segment = 0
      while (segment < lengths.length - 1 && travelled > lengths[segment]) {
        travelled -= lengths[segment]
        segment++
      }
      const from = route[segment]
      const to = route[segment + 1]
      const t = lengths[segment] > 0 ? Math.min(travelled / lengths[segment], 1) : 1
      place({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, facing(from, to), Math.floor(seconds / FRAME_SECONDS) % 8)

      if (seconds * SPEED >= total) {
        // Sit down (or slip out of the door) and hand over to the seat map
        const outro = node.animate(
          [
            { opacity: 1, scale: "1" },
            { opacity: 0, scale: plan.kind === "arrive" ? "0.55" : "0.8" },
          ],
          { duration: 240, easing: "ease-in", fill: "forwards" },
        )
        outro.onfinish = () => onDone(plan.key)
        return
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [plan, scale, size, onDone])

  return (
    <div
      ref={element}
      aria-hidden
      className="crowd-sprite"
      style={{ backgroundImage: `url(${spriteFor(plan.channel)})`, backgroundSize: "800% 400%" }}
    />
  )
}

function Usher({ floor, scale, waveKey, size }: { floor: Floor; scale: number; waveKey: number; size: number }) {
  // Wave once for each new arrival, then go back to standing about
  const [seenKey, setSeenKey] = useState(waveKey)
  const [waving, setWaving] = useState(false)
  if (waveKey !== seenKey) {
    setSeenKey(waveKey)
    setWaving(true)
  }

  const px = size * scale
  const x = CENTER_X * scale - px / 2
  const y = (floor.height + LOBBY - 14) * scale - px * 0.86

  return (
    <div
      key={waving ? `wave-${seenKey}` : "idle"}
      aria-hidden
      className={waving ? "usher usher-wave" : "usher usher-idle"}
      onAnimationEnd={() => setWaving(false)}
      style={{ width: px, height: px, transform: `translate3d(${x}px, ${y}px, 0)` }}
    >
      {waving && <span className="usher-beam" />}
    </div>
  )
}

export function CrowdLayer({
  floor,
  height,
  walkers,
  onWalkerDone,
  waveKey,
}: {
  floor: Floor
  height: number
  walkers: WalkerPlan[]
  onWalkerDone: (key: string) => void
  waveKey: number
}) {
  const layer = useRef<HTMLDivElement>(null)
  const scaleRef = useRef(0)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const node = layer.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      scaleRef.current = entry.contentRect.width / WIDTH
      setScale(scaleRef.current)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const done = useCallback((key: string) => onWalkerDone(key), [onWalkerDone])
  const spriteSize = floor.pitch * 1.9

  return (
    <div ref={layer} className="pointer-events-none absolute inset-0 overflow-hidden" data-height={height}>
      {scale > 0 && (
        <>
          {walkers.map((plan) => (
            <Walker key={plan.key} plan={plan} scale={scaleRef} size={spriteSize} onDone={done} />
          ))}
          <Usher floor={floor} scale={scale} waveKey={waveKey} size={Math.max(spriteSize * 1.15, 44)} />
        </>
      )}
    </div>
  )
}
