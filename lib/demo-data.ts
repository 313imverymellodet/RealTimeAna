import type { BreakdownRow, RangeKey, Realtime, Stats, Totals } from "@/lib/stats"
import { RANGES } from "@/lib/stats"

// Sample data for the public demo. Shapes match the real stats API exactly;
// the numbers are generated, and the demo page says so.

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

function share(total: number, parts: [string, number][]): BreakdownRow[] {
  return parts.map(([label, weight]) => ({
    label,
    visitors: Math.round(total * weight),
    pageviews: Math.round(total * weight * 2.4),
  }))
}

export function getDemoStats(range: RangeKey): Stats {
  const { unit, days } = RANGES[range]
  const random = seeded(days * 7919)
  const now = new Date()
  const buckets = unit === "hour" ? now.getHours() + 1 : days

  const series = Array.from({ length: buckets }, (_, i) => {
    const date = new Date(now)
    if (unit === "hour") {
      date.setHours(i, 0, 0, 0)
    } else {
      date.setDate(now.getDate() - (buckets - 1 - i))
      date.setHours(0, 0, 0, 0)
    }
    const hour = date.getHours()
    const weekday = date.getDay()
    const shape =
      unit === "hour" ? 0.25 + Math.exp(-((hour - 14) ** 2) / 30) : weekday === 0 || weekday === 6 ? 0.6 : 1 + i / (buckets * 4)
    const visitors = Math.round((unit === "hour" ? 95 : 1450) * shape * (0.85 + random() * 0.3))
    const pad = (n: number) => String(n).padStart(2, "0")
    return {
      t: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:00:00`,
      visitors,
      pageviews: Math.round(visitors * (2.2 + random() * 0.5)),
    }
  })

  const visitors = series.reduce((sum, point) => sum + point.visitors, 0)
  const pageviews = series.reduce((sum, point) => sum + point.pageviews, 0)
  const totals: Totals = { visitors, pageviews, sessions: Math.round(visitors * 1.15), bounceRate: 41.8, avgDuration: 164 }
  const previous: Totals = {
    visitors: Math.round(visitors * 0.89),
    pageviews: Math.round(pageviews * 0.92),
    sessions: Math.round(visitors),
    bounceRate: 44.1,
    avgDuration: 151,
  }

  return {
    range,
    unit,
    hasData: true,
    totals,
    previous,
    series,
    pages: share(visitors, [
      ["/", 0.46],
      ["/pricing", 0.19],
      ["/blog/launch-week", 0.12],
      ["/docs", 0.09],
      ["/changelog", 0.05],
      ["/about", 0.03],
    ]),
    referrers: share(visitors, [
      ["Direct / none", 0.34],
      ["google.com", 0.27],
      ["news.ycombinator.com", 0.14],
      ["x.com", 0.11],
      ["github.com", 0.07],
      ["reddit.com", 0.04],
    ]),
    countries: share(visitors, [
      ["US", 0.38],
      ["DE", 0.12],
      ["GB", 0.1],
      ["IN", 0.09],
      ["CA", 0.06],
    ]),
    devices: share(visitors, [
      ["Desktop", 0.58],
      ["Mobile", 0.38],
      ["Tablet", 0.04],
    ]),
    browsers: share(visitors, [
      ["Chrome", 0.55],
      ["Safari", 0.27],
      ["Firefox", 0.1],
      ["Edge", 0.06],
    ]),
    systems: share(visitors, [
      ["macOS", 0.33],
      ["Windows", 0.25],
      ["iOS", 0.24],
      ["Android", 0.14],
      ["Linux", 0.04],
    ]),
  }
}

const CITIES: [number, number, string, string][] = [
  [40.7, -74.0, "New York", "US"],
  [37.8, -122.4, "San Francisco", "US"],
  [42.3, -83.0, "Detroit", "US"],
  [51.5, -0.1, "London", "GB"],
  [52.5, 13.4, "Berlin", "DE"],
  [48.9, 2.4, "Paris", "FR"],
  [35.7, 139.7, "Tokyo", "JP"],
  [1.4, 103.8, "Singapore", "SG"],
  [-33.9, 151.2, "Sydney", "AU"],
  [19.1, 72.9, "Mumbai", "IN"],
  [-23.6, -46.6, "São Paulo", "BR"],
  [43.7, -79.4, "Toronto", "CA"],
  [6.5, 3.4, "Lagos", "NG"],
  [25.2, 55.3, "Dubai", "AE"],
]

export function getDemoRealtime(): Realtime {
  // Changes every 10 seconds so the demo visibly moves
  const random = seeded(Math.floor(Date.now() / 10_000))
  const points = CITIES.filter(() => random() > 0.35).map(([lat, lng, city, country]) => ({ lat, lng, city, country }))
  const visitors = points.length + Math.floor(random() * 12) + 6

  return {
    visitors,
    points,
    pages: [
      { label: "/", visitors: Math.ceil(visitors * 0.45) },
      { label: "/pricing", visitors: Math.ceil(visitors * 0.25) },
      { label: "/blog/launch-week", visitors: Math.ceil(visitors * 0.15) },
      { label: "/docs", visitors: Math.ceil(visitors * 0.1) },
    ],
  }
}
