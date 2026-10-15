// Runs the script sites actually load (public/tracker.js, minified) in a fake browser
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { runInNewContext } from "node:vm"
import { beforeAll, describe, expect, it } from "vitest"

type Payload = Record<string, unknown>

interface Options {
  hostname?: string
  doNotTrack?: string
  search?: string
  referrer?: string
}

function boot(options: Options = {}) {
  const sent: Payload[] = []
  const documentListeners: Record<string, (event?: unknown) => void> = {}
  const windowListeners: Record<string, (event?: unknown) => void> = {}

  const window: Record<string, unknown> = {
    scrollY: 0,
    innerHeight: 800,
    addEventListener: (type: string, fn: () => void) => (windowListeners[type] = fn),
  }
  const document = {
    currentScript: {
      getAttribute: (name: string) => (name === "data-site-id" ? "site-1" : null),
      src: "https://housecount.example/tracker.js",
    },
    referrer: options.referrer ?? "",
    visibilityState: "visible",
    documentElement: { scrollHeight: 4000, scrollTop: 0 },
    body: { scrollHeight: 4000 },
    addEventListener: (type: string, fn: () => void) => (documentListeners[type] = fn),
  }
  const location = { hostname: options.hostname ?? "news.example", protocol: "https:", pathname: "/story", search: options.search ?? "" }
  const history = { pushState() {} }
  const navigator = {
    doNotTrack: options.doNotTrack,
    sendBeacon: (_url: string, blob: { text: string }) => {
      sent.push(JSON.parse(blob.text))
      return true
    },
  }
  class FakeBlob {
    text: string
    constructor(parts: string[]) {
      this.text = parts.join("")
    }
  }

  const context = {
    window,
    document,
    location,
    history,
    navigator,
    Blob: FakeBlob,
    URL,
    URLSearchParams,
    crypto: { randomUUID: () => "11111111-1111-4111-8111-111111111111" },
    requestAnimationFrame: (fn: () => void) => fn(),
    console,
    Date,
    Math,
    JSON,
    Number,
    String,
    Array,
  }
  Object.assign(window, { crypto: context.crypto })
  runInNewContext(readFileSync("public/tracker.js", "utf8"), context)

  return {
    sent,
    window,
    location,
    history,
    scrollTo(y: number) {
      window.scrollY = y
      windowListeners.scroll?.()
    },
    leave() {
      windowListeners.pagehide?.()
    },
    click(attributes: Record<string, string>) {
      documentListeners.click?.({ target: { closest: () => ({ getAttribute: (name: string) => attributes[name] ?? null }) } })
    },
  }
}

beforeAll(() => {
  // Test the minified file that is actually served
  execFileSync("node", ["scripts/build-tracker.mjs"])
})

describe("tracker", () => {
  it("sends a pageview with campaign tags, treating ?ref as the campaign", () => {
    const page = boot({ search: "?ref=partner-blog", referrer: "https://t.co/x" })
    expect(page.sent[0]).toMatchObject({
      type: "pageview",
      siteId: "site-1",
      path: "/story",
      referrer: "https://t.co/x",
      utmCampaign: "partner-blog",
      utmSource: null,
    })
  })

  it("reports the furthest point scrolled, never less", () => {
    const page = boot()
    page.scrollTo(1200)
    page.scrollTo(2400)
    page.scrollTo(400)
    page.leave()
    expect(page.sent.find((p) => p.type === "duration")).toMatchObject({ depth: 80 })
  })

  it("sends goals, revenue and member ids under both the new and old names", () => {
    const page = boot()
    const housecount = page.window.housecount as ((name: string, props?: { revenue: number }) => void) & {
      identify: (id: string) => void
    }
    housecount("membership", { revenue: 8 })
    ;(page.window.pulse as (name: string) => void)("legacy-name")
    housecount.identify("member_1")
    housecount.identify("member_1") // repeated calls on one page are sent once
    page.click({ "data-housecount-goal": "newsletter signup", "data-housecount-revenue": "2.5" })
    page.click({ "data-pulse-goal": "old-button" })

    const events = page.sent.filter((p) => p.type !== "pageview")
    expect(events).toEqual([
      expect.objectContaining({ type: "event", name: "membership", revenue: 8 }),
      expect.objectContaining({ type: "event", name: "legacy-name" }),
      expect.objectContaining({ type: "identify", userId: "member_1" }),
      expect.objectContaining({ type: "event", name: "newsletter signup", revenue: 2.5 }),
      expect.objectContaining({ type: "event", name: "old-button" }),
    ])
  })

  it("stays silent for Do Not Track and on localhost", () => {
    expect(boot({ doNotTrack: "1" }).sent).toHaveLength(0)
    expect(boot({ hostname: "localhost" }).sent).toHaveLength(0)
  })

  it("counts single-page app navigation as a new view", () => {
    const page = boot()
    page.location.pathname = "/next-story"
    page.history.pushState()
    const views = page.sent.filter((p) => p.type === "pageview").map((p) => p.path)
    expect(views).toEqual(["/story", "/next-story"])
    expect(page.sent.some((p) => p.type === "duration" && p.path === "/story")).toBe(true)
  })
})
