// How a visit arrived, grouped into a few channels. Safe to import on the client.

export const CHANNELS = ["Search", "Social", "Newsletter", "Paid", "Referral", "Direct"] as const
export type Channel = (typeof CHANNELS)[number]

// One colour per channel, used for seats, legends and source rows
export const CHANNEL_COLORS: Record<Channel, string> = {
  Search: "#0071e3",
  Social: "#d6336c",
  Newsletter: "#7c3aed",
  Paid: "#0d9488",
  Referral: "#64748b",
  Direct: "#1d1d1f",
}

export function channelColor(channel: string): string {
  return CHANNEL_COLORS[channel as Channel] ?? CHANNEL_COLORS.Referral
}

// Referring hostnames (and utm_source / ref values) that mean a social network
const SOCIAL_HOSTS: [RegExp, string][] = [
  [/(^|\.)(x\.com|twitter\.com|t\.co)$/, "X"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(threads\.net|threads\.com)$/, "Threads"],
  [/(^|\.)(reddit\.com|redd\.it)$/, "Reddit"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)bsky\.app$/, "Bluesky"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn"],
  [/(^|\.)(pinterest\.[a-z.]+|pin\.it)$/, "Pinterest"],
  [/(^|\.)news\.ycombinator\.com$/, "Hacker News"],
  [/(^|\.)(discord\.com|discordapp\.com)$/, "Discord"],
  [/(^|\.)(t\.me|telegram\.org)$/, "Telegram"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
]

const SOCIAL_NAMES: Record<string, string> = {
  x: "X",
  twitter: "X",
  facebook: "Facebook",
  fb: "Facebook",
  instagram: "Instagram",
  ig: "Instagram",
  threads: "Threads",
  reddit: "Reddit",
  youtube: "YouTube",
  yt: "YouTube",
  tiktok: "TikTok",
  bluesky: "Bluesky",
  bsky: "Bluesky",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  mastodon: "Mastodon",
  hackernews: "Hacker News",
  hn: "Hacker News",
  discord: "Discord",
  telegram: "Telegram",
  whatsapp: "WhatsApp",
}

// Networks offered by the tracked-link builder: [utm_source value, label]
export const LINK_NETWORKS: [string, string][] = [
  ["x", "X"],
  ["facebook", "Facebook"],
  ["instagram", "Instagram"],
  ["threads", "Threads"],
  ["bluesky", "Bluesky"],
  ["reddit", "Reddit"],
  ["youtube", "YouTube"],
  ["tiktok", "TikTok"],
  ["linkedin", "LinkedIn"],
  ["newsletter", "Newsletter"],
]

const SEARCH_HOST =
  /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yahoo\.[a-z.]+|yandex\.[a-z]+|baidu\.com|ecosia\.org|search\.brave\.com|kagi\.com|startpage\.com)$/
const MAIL_HOST = /(^|\.)(mail\.google\.com|outlook\.live\.com|mail\.yahoo\.com|mail\.proton\.me)$/
const NEWSLETTER_NAME = /newsletter|email|substack|beehiiv|mailchimp|convertkit|kit|buttondown|ghost/

export interface SourceClass {
  channel: Channel
  // Social network name when the channel is Social
  network: string | null
}

// Tags on the link win over the referrer, because apps and email clients often send no referrer
export function classifySource(
  referrerHost: string | null,
  utmSource: string | null,
  utmMedium: string | null,
): SourceClass {
  const source = (utmSource || "").trim().toLowerCase()
  const medium = (utmMedium || "").trim().toLowerCase()

  if (/^(cpc|ppc|paid|ads?|display|paidsocial|paid-social)$/.test(medium)) {
    return { channel: "Paid", network: SOCIAL_NAMES[source] ?? null }
  }
  if (/email|newsletter/.test(medium) || NEWSLETTER_NAME.test(source)) {
    return { channel: "Newsletter", network: null }
  }
  if (SOCIAL_NAMES[source]) {
    return { channel: "Social", network: SOCIAL_NAMES[source] }
  }
  if (medium === "social") {
    return { channel: "Social", network: utmSource ? utmSource.trim().slice(0, 40) : null }
  }

  const host = (referrerHost || "").toLowerCase()
  if (host) {
    for (const [pattern, name] of SOCIAL_HOSTS) {
      if (pattern.test(host)) return { channel: "Social", network: name }
    }
    if (MAIL_HOST.test(host)) return { channel: "Newsletter", network: null }
    // Google News sends readers like a referring site, not like a search
    if (SEARCH_HOST.test(host) && !host.startsWith("news.")) return { channel: "Search", network: null }
    return { channel: "Referral", network: null }
  }

  return source ? { channel: "Referral", network: null } : { channel: "Direct", network: null }
}
