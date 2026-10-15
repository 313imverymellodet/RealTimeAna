import { describe, expect, it } from "vitest"
import { classifySource } from "@/lib/channels"

describe("classifySource", () => {
  it.each([
    // [referrer host, utm_source, utm_medium, channel, network]
    ["t.co", null, null, "Social", "X"],
    ["x.com", null, null, "Social", "X"],
    ["l.facebook.com", null, null, "Social", "Facebook"],
    ["go.bsky.app", null, null, "Social", "Bluesky"],
    ["old.reddit.com", null, null, "Social", "Reddit"],
    ["news.ycombinator.com", null, null, "Social", "Hacker News"],
    ["google.com", null, null, "Search", null],
    ["www.google.co.uk", null, null, "Search", null],
    ["duckduckgo.com", null, null, "Search", null],
    ["news.google.com", null, null, "Referral", null],
    ["mail.google.com", null, null, "Newsletter", null],
    ["someblog.net", null, null, "Referral", null],
    [null, null, null, "Direct", null],
    [null, "bluesky", "social", "Social", "Bluesky"],
    [null, "x", null, "Social", "X"],
    [null, "newsletter", "email", "Newsletter", null],
    [null, "sunday-digest", "email", "Newsletter", null],
    [null, "google", "cpc", "Paid", null],
    [null, "facebook", "paid-social", "Paid", "Facebook"],
    [null, "partner-site", null, "Referral", null],
  ])("%s / %s / %s is %s", (host, source, medium, channel, network) => {
    expect(classifySource(host, source, medium)).toEqual({ channel, network })
  })

  it("lets link tags win over the referrer", () => {
    // An email client that passes a webmail referrer, on a link tagged for a social post
    expect(classifySource("mail.google.com", "x", "social")).toEqual({ channel: "Social", network: "X" })
  })
})
