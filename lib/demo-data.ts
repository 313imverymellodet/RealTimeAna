import type { FunnelResult } from "@/lib/funnels"
import type { JourneyStep, VisitorSummary } from "@/lib/journeys"
import type { AccountOverview } from "@/lib/social"
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
      ["/membership", 0.19],
      ["/news/city-budget-vote", 0.12],
      ["/reviews/best-of-2026", 0.09],
      ["/newsletter", 0.05],
      ["/sports/friday-recap", 0.03],
    ]),
    stories: (
      [
        ["/", 0.46, 38, 71, 22],
        ["/news/city-budget-vote", 0.21, 214, 83, 61],
        ["/membership", 0.19, 95, 64, 40],
        ["/reviews/best-of-2026", 0.12, 302, 58, 27],
        ["/news/stadium-deal-explained", 0.09, 251, 77, 52],
        ["/newsletter", 0.05, 41, 92, 86],
        ["/sports/friday-recap", 0.03, 146, 49, 18],
      ] as [string, number, number, number, number][]
    ).map(([path, share, avgSeconds, depth, finished]) => ({
      path,
      readers: Math.round(visitors * share),
      views: Math.round(visitors * share * 1.3),
      avgSeconds,
      depth,
      finished,
    })),
    record: { visitors: 2140, day: series[Math.max(series.length - 4, 0)].t.slice(0, 10) },
    today: unit === "hour" ? visitors : series[series.length - 1].visitors,
    channels: share(
      visitors,
      [
        ["Search", 0.29, 0.31],
        ["Social", 0.26, 0.28],
        ["Direct", 0.22, 0.14],
        ["Newsletter", 0.14, 0.21],
        ["Referral", 0.09, 0.06],
      ],
      revenueCents,
    ),
    networks: share(
      visitors,
      [
        ["X", 0.11, 0.14],
        ["Facebook", 0.07, 0.08],
        ["Reddit", 0.04, 0.03],
        ["Bluesky", 0.025, 0.02],
        ["Instagram", 0.015, 0.01],
      ],
      revenueCents,
    ),
    entryPages: share(visitors, [
      ["/", 0.52],
      ["/news/city-budget-vote", 0.21],
      ["/membership", 0.11],
      ["/reviews/best-of-2026", 0.08],
      ["/newsletter", 0.04],
    ]),
    referrers: share(
      visitors,
      [
        ["Direct / none", 0.34, 0.22],
        ["google.com", 0.27, 0.31],
        ["news.google.com", 0.14, 0.08],
        ["x.com", 0.11, 0.24],
        ["facebook.com", 0.07, 0.11],
        ["reddit.com", 0.04, 0.04],
      ],
      revenueCents,
    ),
    campaigns: share(
      visitors,
      [
        ["sunday-newsletter", 0.13, 0.21],
        ["sponsor-roundup", 0.06, 0.14],
        ["breaking-alert", 0.04, 0.05],
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
      { name: "newsletter signup", completions: signups, visitors: signups, revenueCents: 0 },
      { name: "membership", completions: purchases, visitors: purchases, revenueCents },
      { name: "affiliate click", completions: Math.round(visitors * 0.021), visitors: Math.round(visitors * 0.021), revenueCents: 0 },
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

  // Shaped curves so the sparklines read like real traffic; everything else is derived
  // from them, so the house, the stage and the top-stories list always agree
  const curves: [string, number[], boolean][] = [
    ["/news/city-budget-vote", [1, 1, 2, 2, 3, 4, 5, 6, 7, 8], true],
    ["/", [5, 4, 6, 5, 5, 6, 5, 4, 5, 6], false],
    ["/membership", [2, 3, 2, 3, 3, 2, 3, 3, 2, 3], false],
    ["/reviews/best-of-2026", [4, 4, 3, 3, 3, 2, 2, 2, 2, 2], false],
    ["/news/stadium-deal-explained", [0, 0, 1, 1, 1, 1, 2, 2, 3, 4], true],
  ]
  const trending = curves
    .map(([path, shape, rising]) => {
      const spark = shape.map((n) => Math.max(0, n + Math.round((random() - 0.5) * 2)))
      return { path, spark, rising, now: Math.max(spark[spark.length - 1], 1), recent: spark.reduce((a, b) => a + b, 0) }
    })
    .sort((a, b) => b.now - a.now || b.recent - a.recent)
  const visitors = trending.reduce((sum, story) => sum + story.now, 0)
  const readingPaths = trending.flatMap((story) => Array<string>(story.now).fill(story.path))

  const mix = ["Search", "Search", "Social", "Social", "Social", "Direct", "Direct", "Newsletter", "Referral"]
  const sources: Record<string, (i: number) => string | null> = {
    Search: () => "google.com",
    Social: (i) => ["X", "Facebook", "Reddit", "Bluesky"][i % 4],
    Newsletter: () => "Sunday newsletter",
    Referral: () => "news.google.com",
    Direct: () => null,
  }
  const seats = Array.from({ length: visitors }, (_, i) => {
    const channel = mix[(i * 5 + 3) % mix.length]
    return {
      // Stable ids so most people keep their seat between refreshes
      id: `demo${String((i * 7919) % 9973).padStart(8, "0")}`,
      channel,
      source: sources[channel](i),
      path: readingPaths[i],
      country: ["US", "US", "DE", "GB", "CA", "IN"][(i * 7) % 6],
    }
  })
  const arrivals = points.slice(0, 4).map((point, i) => ({
    at: new Date(Date.now() - (i * 55 + 8) * 1000).toISOString(),
    channel: ["Search", "Social", "Newsletter", "Social"][i],
    source: ["google.com", "X", "Sunday newsletter", "Reddit"][i],
    city: point.city,
    country: point.country,
    path: ["/news/city-budget-vote", "/", "/membership", "/reviews/best-of-2026"][i],
  }))

  return {
    visitors,
    points,
    seats,
    arrivals,
    trending,
    pages: trending.map((story) => ({ label: story.path, visitors: story.now })),
  }
}

export function getDemoFunnels(range: RangeKey): FunnelResult[] {
  const visitors = getDemoStats(range).totals.visitors
  const counts = [0.46, 0.19, 0.046, 0.011].map((share) => Math.round(visitors * share))
  return [
    {
      id: "demo-signup-to-sale",
      name: "Story to member",
      steps: [
        { type: "page", value: "/news/*", visitors: counts[0] },
        { type: "page", value: "/membership", visitors: counts[1] },
        { type: "goal", value: "newsletter signup", visitors: counts[2] },
        { type: "goal", value: "membership", visitors: counts[3] },
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
    campaign: "sunday-newsletter",
    steps: [
      [0, "page", "/", 48, null],
      [1, "page", "/membership", 95, null],
      [3, "goal", "newsletter signup", null, null],
      [3, "page", "/reviews/best-of-2026", 140, null],
      [6, "goal", "membership", null, 7900],
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
      [0, "page", "/news/city-budget-vote", 210, null],
      [4, "page", "/", 30, null],
      [5, "goal", "affiliate click", null, null],
    ],
  },
  {
    id: "5c2e9b7a1d3f48609e8b7a6c5d4e3f2a",
    minutesAgo: 14,
    place: ["GB", "London"],
    agent: ["Desktop", "Firefox", "Windows"],
    referrer: "news.google.com",
    campaign: null,
    steps: [
      [0, "page", "/", 22, null],
      [1, "page", "/membership", 64, null],
      [2, "page", "/reviews/best-of-2026", 180, null],
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
    referrer: "facebook.com",
    campaign: "newsletter",
    steps: [
      [0, "page", "/newsletter", 75, null],
      [1, "page", "/membership", 110, null],
      [3, "goal", "newsletter signup", null, null],
      [4, "goal", "membership", null, 2900],
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
      [0, "page", "/reviews/best-of-2026", 95, null],
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
      // The two buyers in the sample are shown as signed-in users
      identified: goals.some((step) => step[2] === "membership"),
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

export function getDemoSocial(): AccountOverview[] {
  const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()
  return [
    {
      id: "demo-bluesky",
      network: "bluesky",
      networkLabel: "Bluesky",
      handle: "northsidepost.bsky.social",
      displayName: "The Northside Post",
      avatarUrl: null,
      profileUrl: "https://bsky.app",
      followers: 4812,
      posts: 1294,
      followerChange: 186,
      trackingSince: "2026-09-01",
      readersThisWeek: 742,
      stale: false,
      recentPosts: [
        {
          id: "p1",
          url: "https://bsky.app",
          text: "Council votes 7-2 to pass the budget. What changes for libraries, buses and parks, explained in five minutes.",
          createdAt: hoursAgo(3),
          likes: 412,
          reposts: 138,
          replies: 57,
          links: [],
          linksToSite: true,
          readers: 318,
        },
        {
          id: "p2",
          url: "https://bsky.app",
          text: "Friday recap is up: three upsets, one buzzer beater and the play everyone is still arguing about.",
          createdAt: hoursAgo(20),
          likes: 96,
          reposts: 21,
          replies: 14,
          links: [],
          linksToSite: true,
          readers: 84,
        },
        {
          id: "p3",
          url: "https://bsky.app",
          text: "We are hiring a part-time photographer for game nights. Send us your best shot.",
          createdAt: hoursAgo(31),
          likes: 151,
          reposts: 47,
          replies: 22,
          links: [],
          linksToSite: false,
          readers: null,
        },
      ],
    },
    {
      id: "demo-mastodon",
      network: "mastodon",
      networkLabel: "Mastodon",
      handle: "northside@mastodon.social",
      displayName: "Northside Post",
      avatarUrl: null,
      profileUrl: "https://mastodon.social",
      followers: 1206,
      posts: 640,
      followerChange: 34,
      trackingSince: "2026-09-01",
      readersThisWeek: 131,
      stale: false,
      recentPosts: [
        {
          id: "m1",
          url: "https://mastodon.social",
          text: "The stadium deal, explained without the spin: who pays, who profits, and what happens if it falls through.",
          createdAt: hoursAgo(9),
          likes: 64,
          reposts: 39,
          replies: 11,
          links: [],
          linksToSite: true,
          readers: 97,
        },
      ],
    },
  ]
}
