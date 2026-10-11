import type { FunnelResult } from "@/lib/funnels"
import type { JourneyStep, VisitorSummary } from "@/lib/journeys"
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

// Each part is [label, share of visitors, share of revenue]
function share(total: number, parts: [string, number, number?][], revenueCents = 0): BreakdownRow[] {
  return parts.map(([label, weight, revenueWeight]) => ({
    label,
    visitors: Math.round(total * weight),
    pageviews: Math.round(total * weight * 2.4),
    revenueCents: Math.round(revenueCents * (revenueWeight ?? 0)),
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
      // A few sales per bucket at $29 or $79
      revenue: Math.round(visitors * 0.012 * (0.4 + random())) * (random() > 0.6 ? 79 : 29),
    }
  })

  const visitors = series.reduce((sum, point) => sum + point.visitors, 0)
  const pageviews = series.reduce((sum, point) => sum + point.pageviews, 0)
  const revenueCents = series.reduce((sum, point) => sum + point.revenue, 0) * 100
  const signups = Math.round(visitors * 0.046)
  const purchases = Math.round(visitors * 0.011)
  const totals: Totals = {
    visitors,
    pageviews,
    sessions: Math.round(visitors * 1.15),
    bounceRate: 41.8,
    avgDuration: 164,
    conversions: signups + purchases,
    conversionRate: 4.9,
    revenueCents,
  }
  const previous: Totals = {
    visitors: Math.round(visitors * 0.89),
    pageviews: Math.round(pageviews * 0.92),
    sessions: Math.round(visitors),
    bounceRate: 44.1,
    avgDuration: 151,
    conversions: Math.round((signups + purchases) * 0.84),
    conversionRate: 4.4,
    revenueCents: Math.round(revenueCents * 0.81),
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
    entryPages: share(visitors, [
      ["/", 0.52],
      ["/blog/launch-week", 0.21],
      ["/pricing", 0.11],
      ["/docs", 0.08],
      ["/changelog", 0.04],
    ]),
    referrers: share(
      visitors,
      [
        ["Direct / none", 0.34, 0.22],
        ["google.com", 0.27, 0.31],
        ["news.ycombinator.com", 0.14, 0.08],
        ["x.com", 0.11, 0.24],
        ["github.com", 0.07, 0.11],
        ["reddit.com", 0.04, 0.04],
      ],
      revenueCents,
    ),
    campaigns: share(
      visitors,
      [
        ["launch-week", 0.13, 0.21],
        ["newsletter", 0.06, 0.14],
        ["producthunt", 0.04, 0.05],
      ],
      revenueCents,
    ),
    countries: share(
      visitors,
      [
        ["US", 0.38, 0.47],
        ["DE", 0.12, 0.13],
        ["GB", 0.1, 0.12],
        ["IN", 0.09, 0.03],
        ["CA", 0.06, 0.08],
      ],
      revenueCents,
    ),
    cities: share(visitors, [
      ["New York, US", 0.07],
      ["San Francisco, US", 0.06],
      ["London, GB", 0.05],
      ["Berlin, DE", 0.04],
      ["Bengaluru, IN", 0.03],
    ]),
    goals: [
      { name: "signup", completions: signups, visitors: signups, revenueCents: 0 },
      { name: "purchase", completions: purchases, visitors: purchases, revenueCents },
      { name: "newsletter", completions: Math.round(visitors * 0.021), visitors: Math.round(visitors * 0.021), revenueCents: 0 },
    ],
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

export function getDemoFunnels(range: RangeKey): FunnelResult[] {
  const visitors = getDemoStats(range).totals.visitors
  const counts = [0.46, 0.19, 0.046, 0.011].map((share) => Math.round(visitors * share))
  return [
    {
      id: "demo-signup-to-sale",
      name: "Homepage to purchase",
      steps: [
        { type: "page", value: "/", visitors: counts[0] },
        { type: "page", value: "/pricing", visitors: counts[1] },
        { type: "goal", value: "signup", visitors: counts[2] },
        { type: "goal", value: "purchase", visitors: counts[3] },
      ],
    },
  ]
}

// [minutes after arrival, kind, label, seconds on page, revenue in cents]
type DemoStep = [number, "page" | "goal", string, number | null, number | null]

const DEMO_VISITORS: {
  id: string
  minutesAgo: number
  place: [string, string]
  agent: [string, string, string]
  referrer: string | null
  campaign: string | null
  steps: DemoStep[]
}[] = [
  {
    id: "3f9a1c0be2d44a7f8b6c5d1e0f9a2b3c",
    minutesAgo: 2,
    place: ["US", "Detroit"],
    agent: ["Desktop", "Chrome", "macOS"],
    referrer: "x.com",
    campaign: "launch-week",
    steps: [
      [0, "page", "/", 48, null],
      [1, "page", "/pricing", 95, null],
      [3, "goal", "signup", null, null],
      [3, "page", "/docs", 140, null],
      [6, "goal", "purchase", null, 7900],
    ],
  },
  {
    id: "a81d44e07c3b4f5e9d2a6b7c8e9f0a1b",
    minutesAgo: 6,
    place: ["DE", "Berlin"],
    agent: ["Mobile", "Safari", "iOS"],
    referrer: "google.com",
    campaign: null,
    steps: [
      [0, "page", "/blog/launch-week", 210, null],
      [4, "page", "/", 30, null],
      [5, "goal", "newsletter", null, null],
    ],
  },
  {
    id: "5c2e9b7a1d3f48609e8b7a6c5d4e3f2a",
    minutesAgo: 14,
    place: ["GB", "London"],
    agent: ["Desktop", "Firefox", "Windows"],
    referrer: "news.ycombinator.com",
    campaign: null,
    steps: [
      [0, "page", "/", 22, null],
      [1, "page", "/pricing", 64, null],
      [2, "page", "/docs", 180, null],
    ],
  },
  {
    id: "d7f03a6b9c1e4d2a8f5b6c7d8e9a0b1c",
    minutesAgo: 27,
    place: ["IN", "Bengaluru"],
    agent: ["Mobile", "Chrome", "Android"],
    referrer: null,
    campaign: null,
    steps: [[0, "page", "/", 12, null]],
  },
  {
    id: "09be5d2c7a4f4e1b8c3d2e1f0a9b8c7d",
    minutesAgo: 41,
    place: ["CA", "Toronto"],
    agent: ["Desktop", "Safari", "macOS"],
    referrer: "github.com",
    campaign: "newsletter",
    steps: [
      [0, "page", "/changelog", 75, null],
      [1, "page", "/pricing", 110, null],
      [3, "goal", "signup", null, null],
      [4, "goal", "purchase", null, 2900],
    ],
  },
  {
    id: "62c8f1a4b5d9437e9a0b1c2d3e4f5a6b",
    minutesAgo: 58,
    place: ["US", "San Francisco"],
    agent: ["Desktop", "Edge", "Windows"],
    referrer: "reddit.com",
    campaign: null,
    steps: [
      [0, "page", "/docs", 95, null],
      [2, "page", "/", 40, null],
    ],
  },
]

function demoStepTime(minutesAgo: number, offset: number, lastOffset: number) {
  return new Date(Date.now() - (minutesAgo + lastOffset - offset) * 60_000).toISOString()
}

export function getDemoVisitors(): VisitorSummary[] {
  return DEMO_VISITORS.map((visitor) => {
    const last = visitor.steps[visitor.steps.length - 1][0]
    const pages = visitor.steps.filter((step) => step[1] === "page")
    const goals = visitor.steps.filter((step) => step[1] === "goal")
    return {
      id: visitor.id,
      firstSeen: demoStepTime(visitor.minutesAgo, 0, last),
      lastSeen: demoStepTime(visitor.minutesAgo, last, last),
      pageviews: pages.length,
      seconds: pages.reduce((sum, step) => sum + (step[3] ?? 0), 0),
      entryPage: pages[0][2],
      country: visitor.place[0],
      city: visitor.place[1],
      device: visitor.agent[0],
      browser: visitor.agent[1],
      os: visitor.agent[2],
      referrer: visitor.referrer,
      campaign: visitor.campaign,
      goals: goals.length,
      revenueCents: goals.reduce((sum, step) => sum + (step[4] ?? 0), 0),
    }
  })
}

export function getDemoJourney(visitorId: string): JourneyStep[] {
  const visitor = DEMO_VISITORS.find((v) => v.id === visitorId)
  if (!visitor) return []
  const last = visitor.steps[visitor.steps.length - 1][0]
  return visitor.steps.map(([offset, kind, label, seconds, revenueCents]) => ({
    kind,
    at: demoStepTime(visitor.minutesAgo, offset, last),
    label,
    seconds,
    revenueCents,
  }))
}
