import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { buildFloor, HOUSE_SIZES, seatPeople } from "@/lib/auditorium"
import { formatDuration, formatMoney, percentChange } from "@/lib/format"
import { parseSteps } from "@/lib/funnels"
import { isValidDomain, normalizeDomain } from "@/lib/sites"
import { campaignOf, htmlToText, linksToSite, parseHandle } from "@/lib/social"
import { buildTrackedLink } from "@/lib/tracked-link"
import { hashUserId, isBot, parseUserAgent } from "@/lib/visitor"

describe("domains", () => {
  it("normalises what people paste", () => {
    expect(normalizeDomain("https://www.Example.com/pricing?x=1")).toBe("example.com")
    expect(normalizeDomain("blog.example.com:8080")).toBe("blog.example.com")
  })
  it("accepts real domains only", () => {
    expect(isValidDomain("example.com")).toBe(true)
    expect(isValidDomain("news.example.co.uk")).toBe(true)
    expect(isValidDomain("localhost")).toBe(false)
    expect(isValidDomain("not a domain")).toBe(false)
  })
})

describe("user agents", () => {
  it("does not mistake phones for computers", () => {
    const iphone = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1"
    expect(parseUserAgent(iphone)).toEqual({ device: "Mobile", browser: "Safari", os: "iOS" })
    const android = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36"
    expect(parseUserAgent(android)).toEqual({ device: "Mobile", browser: "Chrome", os: "Android" })
    const edge = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36 Edg/126.0"
    expect(parseUserAgent(edge)).toEqual({ device: "Desktop", browser: "Edge", os: "Windows" })
  })
  it("filters bots and empty agents", () => {
    expect(isBot("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true)
    expect(isBot("Mozilla/5.0 HeadlessChrome/126.0")).toBe(true)
    expect(isBot("")).toBe(true)
    expect(isBot("Mozilla/5.0 (Macintosh) Safari/605.1.15")).toBe(false)
  })
})

describe("user ids", () => {
  it("hashes the same id the same way per site, and differently across sites", () => {
    expect(hashUserId("site-a", "member_1")).toBe(hashUserId("site-a", "member_1"))
    expect(hashUserId("site-a", "member_1")).not.toBe(hashUserId("site-b", "member_1"))
    expect(hashUserId("site-a", "member_1")).toMatch(/^[0-9a-f]{32}$/)
  })
})

describe("funnel steps", () => {
  it("accepts 2 to 6 page or goal steps", () => {
    expect(parseSteps([{ type: "page", value: "/" }, { type: "goal", value: "Newsletter Signup" }])).toEqual([
      { type: "page", value: "/" },
      { type: "goal", value: "newsletter signup" },
    ])
  })
  it("rejects bad steps", () => {
    expect(parseSteps([{ type: "page", value: "/" }])).toBeNull()
    expect(parseSteps([{ type: "page", value: "no-slash" }, { type: "page", value: "/" }])).toBeNull()
    expect(parseSteps([{ type: "goal", value: "<script>" }, { type: "page", value: "/" }])).toBeNull()
    expect(parseSteps(Array(7).fill({ type: "page", value: "/" }))).toBeNull()
  })
})

describe("tracked links", () => {
  it("tags a page for a network and post", () => {
    expect(buildTrackedLink("news.example", "/story", "bluesky", "Budget Vote Thread!")).toBe(
      "https://news.example/story?utm_source=bluesky&utm_medium=social&utm_campaign=budget-vote-thread",
    )
    expect(buildTrackedLink("news.example", "https://news.example/a?x=1", "newsletter", "")).toBe(
      "https://news.example/a?x=1&utm_source=newsletter&utm_medium=email",
    )
  })
})

describe("social handles and posts", () => {
  it("accepts the forms people paste", () => {
    expect(parseHandle("bluesky", "@Name.bsky.social")).toBe("name.bsky.social")
    expect(parseHandle("bluesky", "https://bsky.app/profile/name.bsky.social")).toBe("name.bsky.social")
    expect(parseHandle("mastodon", "@User@Mastodon.Social")).toBe("user@mastodon.social")
    expect(parseHandle("mastodon", "https://hachyderm.io/@someone")).toBe("someone@hachyderm.io")
    expect(parseHandle("mastodon", "just-a-name")).toBeNull()
    expect(parseHandle("bluesky", "has spaces")).toBeNull()
  })
  it("recognises links to the site and their campaign", () => {
    const links = ["https://other.com/x", "https://www.news.example/story?utm_campaign=thread-1"]
    expect(linksToSite(links, "news.example")).toBe(true)
    expect(linksToSite(["https://other.com"], "news.example")).toBe(false)
    expect(campaignOf(links, "news.example")).toBe("thread-1")
    expect(campaignOf(["https://news.example/story"], "news.example")).toBeNull()
  })
  it("turns Mastodon HTML into text", () => {
    expect(htmlToText("<p>Hello &amp; welcome<br/>to <a href=\"x\">the site</a></p>")).toBe("Hello & welcome to the site")
  })
})

describe("the auditorium", () => {
  it("always has at least as many seats as each house size asks for", () => {
    for (const size of HOUSE_SIZES) {
      expect(buildFloor(size).chairs.length).toBeGreaterThanOrEqual(size)
    }
  })
  it("is symmetric about the stage", () => {
    const xs = buildFloor(90).chairs.map((chair) => Math.round(chair.x - 360))
    expect(xs.reduce((a, b) => a + b, 0)).toBeLessThan(2)
  })
  it("keeps people in their seats as others come and go", () => {
    // Ids shaped like the real ones: the first 12 hex characters of a visitor hash
    const id = (i: number) => createHash("sha256").update(`visitor-${i}`).digest("hex").slice(0, 12)
    const people = Array.from({ length: 30 }, (_, i) => ({ id: id(i), channel: "Direct", source: null, path: "/", country: null }))
    const before = seatPeople(people, 90)
    const after = seatPeople([...people.slice(5), { id: "new", channel: "Search", source: null, path: "/", country: null }], 90)
    const seatOf = (map: Map<number, { id: string }>, id: string) => [...map].find(([, p]) => p.id === id)?.[0]
    const stayed = people.slice(5).filter((p) => seatOf(before, p.id) === seatOf(after, p.id))
    // Collisions can move the odd person; nearly everyone stays put
    expect(stayed.length).toBeGreaterThanOrEqual(23)
    expect(new Set(after.keys()).size).toBe(26)
  })
})

describe("formatting", () => {
  it("formats durations, money and changes", () => {
    expect(formatDuration(45)).toBe("45s")
    expect(formatDuration(125)).toBe("2m 05s")
    expect(formatMoney(4900)).toBe("$49")
    expect(formatMoney(4950)).toBe("$49.50")
    expect(percentChange(110, 100)).toBe(10)
    expect(percentChange(5, 0)).toBeNull()
  })
})
