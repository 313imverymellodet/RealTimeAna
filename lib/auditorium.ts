import type { Seat } from "@/lib/stats"

// Geometry of the seat map. Drawn as a floor plan: a stage at the top and
// curved rows below it in three sections split by two aisles. Every row is an
// arc around one point far above the stage, so rows bend gently toward it.

export const WIDTH = 720
export const CENTER_X = WIDTH / 2
const CENTER_Y = -430
export const STAGE_RADIUS = 512
const FIRST_ROW_RADIUS = 566
const LAST_ROW_RADIUS = 806
const HALF_ANGLE = (21 * Math.PI) / 180
const AISLE_AT = HALF_ANGLE * 0.36
// The room is rebuilt one size up as it fills, so it never looks packed or deserted
export const HOUSE_SIZES = [90, 160, 300, 560]

export interface Chair {
  x: number
  y: number
  // Degrees to turn the chair so it faces the stage
  turn: number
  // Where it sits on the shared circle: distance from the centre, and angle
  radius: number
  angle: number
}

export interface Floor {
  chairs: Chair[]
  pitch: number
  height: number
}

export function point(radius: number, angle: number) {
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
      chairs.push({ ...point(radius, angle), turn: (-angle * 180) / Math.PI, radius, angle })
    }
  }
  return chairs
}

// Largest chairs that still give the room at least `target` seats
export function buildFloor(target: number): Floor {
  for (let pitch = 46; pitch >= 9; pitch -= 1) {
    const chairs = rowsFor(pitch).flatMap((radius) => chairsInRow(radius, pitch))
    if (chairs.length >= target || pitch === 9) {
      const lowest = Math.max(...chairs.map((chair) => chair.y))
      return { chairs, pitch, height: lowest + pitch * 0.6 + 10 }
    }
  }
  return { chairs: [], pitch: 9, height: 400 }
}

// FNV-1a with a final mix, so similar ids land far apart and rarely collide
function hash(text: string) {
  let value = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    value ^= text.charCodeAt(i)
    value = Math.imul(value, 0x01000193)
  }
  value ^= value >>> 16
  value = Math.imul(value, 0x85ebca6b)
  value ^= value >>> 13
  value = Math.imul(value, 0xc2b2ae35)
  value ^= value >>> 16
  return value >>> 0
}

// Each person's seat comes from their id, so they stay put between refreshes.
// Two people wanting the same seat are settled in id order, which is also stable.
export function seatPeople(people: Seat[], capacity: number) {
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

// ---------------------------------------------------------------------------
// Walking routes: in through a door in the lobby, up the nearest aisle,
// along the row to the seat. Leaving is the same route backwards.
// ---------------------------------------------------------------------------

// Strip below the seats where the doors and the usher are
export const LOBBY = 74

export type Facing = "up" | "right" | "down" | "left"

export interface Waypoint {
  x: number
  y: number
}

export function doorFor(floor: Floor, side: -1 | 1): Waypoint {
  const foot = point(LAST_ROW_RADIUS + floor.pitch, side * AISLE_AT)
  return { x: foot.x, y: floor.height + LOBBY - 16 }
}

export function routeTo(floor: Floor, chair: Chair): Waypoint[] {
  const side = chair.angle < 0 ? -1 : 1
  const aisle = side * AISLE_AT
  return [
    doorFor(floor, side),
    point(LAST_ROW_RADIUS + floor.pitch, aisle),
    point(chair.radius, aisle),
    { x: chair.x, y: chair.y },
  ]
}

// Which way a sprite faces while walking from one point to the next
export function facing(from: Waypoint, to: Waypoint): Facing {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dy) >= Math.abs(dx)) return dy < 0 ? "up" : "down"
  return dx > 0 ? "right" : "left"
}

