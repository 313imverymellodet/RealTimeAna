import "server-only"
import { and, asc, eq, gte, sql } from "drizzle-orm"
import { getDb, schema } from "@/lib/db"
import { normalizeDomain } from "@/lib/sites"

// Public profile and post data from Bluesky and Mastodon. Both networks publish
// this without any login or app approval, so connecting is just a handle.

export type Network = "bluesky" | "mastodon"
export const NETWORK_LABELS: Record<Network, string> = { bluesky: "Bluesky", mastodon: "Mastodon" }
export const MAX_ACCOUNTS_PER_SITE = 4

const TIMEOUT_MS = 6000
// How long after a post its readers are credited to it, when the link carries no campaign tag
const POST_WINDOW_MS = 48 * 60 * 60 * 1000

export interface Profile {
  network: Network
  handle: string
  remoteId: string
  displayName: string | null
  avatarUrl: string | null
  profileUrl: string
  followers: number
  posts: number
}

export interface SocialPost {
  id: string
  url: string
  text: string
  createdAt: string
  likes: number
  reposts: number
  replies: number
  links: string[]
}

export interface PostWithReaders extends SocialPost {
  linksToSite: boolean
  // Distinct readers credited to this post, or null when it does not link to the site
  readers: number | null
}

export interface AccountOverview {
  id: string
  network: Network
  networkLabel: string
  handle: string
  displayName: string | null
  avatarUrl: string | null
  profileUrl: string
  followers: number
  posts: number
  // Followers gained over 7 days, or null until a week of history exists
  followerChange: number | null
  trackingSince: string
  // Distinct readers from this network over the last 7 days
  readersThisWeek: number
  recentPosts: PostWithReaders[]
  // Set when the network could not be reached; the numbers are the last ones saved
  stale: boolean
}

// ---------------------------------------------------------------------------
// Handles
// ---------------------------------------------------------------------------

export function parseHandle(network: Network, input: string): string | null {
  let value = input.trim()
  if (network === "bluesky") {
    value = value.replace(/^https?:\/\/bsky\.app\/profile\//i, "").replace(/^@/, "").split(/[/?#]/)[0].toLowerCase()
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(value) || /^did:plc:[a-z0-9]+$/.test(value)
      ? value
      : null
  }

  // Mastodon: @user@instance, user@instance, or https://instance/@user
  const fromUrl = value.match(/^https?:\/\/([^/]+)\/@([^/?#]+)/i)
  if (fromUrl) value = `${fromUrl[2]}@${fromUrl[1]}`
  value = value.replace(/^@/, "").toLowerCase()
  const [user, host] = value.split("@")
  if (!user || !host || !/^[a-z0-9_]+$/.test(user) || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) return null
  return `${user}@${host}`
}

// ---------------------------------------------------------------------------
// Network clients
// ---------------------------------------------------------------------------

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Housecount (+https://housecount.si)" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  })
  if (!response.ok) throw new Error(`${response.status} from ${new URL(url).host}`)
  return (await response.json()) as T
}

const BSKY = "https://public.api.bsky.app/xrpc"

interface BskyProfile {
  did: string
  handle: string
  displayName?: string
  avatar?: string
  followersCount?: number
  postsCount?: number
}

interface BskyFeedItem {
  reason?: { $type?: string }
  post: {
    uri: string
    author: { did: string; handle: string }
    record: { text?: string; createdAt?: string; facets?: { features?: { $type?: string; uri?: string }[] }[] }
    embed?: { external?: { uri?: string } }
    likeCount?: number
    repostCount?: number
    replyCount?: number
    quoteCount?: number
  }
}

interface MastodonAccount {
  id: string
  acct: string
  display_name?: string
  avatar?: string
  url: string
  followers_count?: number
  statuses_count?: number
}

interface MastodonStatus {
  id: string
  url: string | null
  created_at: string
  content: string
  favourites_count?: number
  reblogs_count?: number
  replies_count?: number
  card?: { url?: string } | null
}

export function htmlToText(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
}

function linksInHtml(html: string) {
  return [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, "&")).filter((u) => /^https?:/.test(u))
}

export async function fetchProfile(network: Network, handle: string): Promise<Profile> {
  if (network === "bluesky") {
    const p = await getJson<BskyProfile>(`${BSKY}/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`)
    return {
      network,
      handle: p.handle,
      remoteId: p.did,
      displayName: p.displayName || null,
      avatarUrl: p.avatar || null,
      profileUrl: `https://bsky.app/profile/${p.handle}`,
      followers: p.followersCount ?? 0,
      posts: p.postsCount ?? 0,
    }
  }

  const [user, host] = handle.split("@")
  const a = await getJson<MastodonAccount>(`https://${host}/api/v1/accounts/lookup?acct=${encodeURIComponent(user)}`)
  return {
    network,
    handle: `${a.acct.split("@")[0].toLowerCase()}@${host}`,
    remoteId: a.id,
    displayName: a.display_name || null,
    avatarUrl: a.avatar || null,
    profileUrl: a.url,
    followers: a.followers_count ?? 0,
    posts: a.statuses_count ?? 0,
  }
}

export async function fetchPosts(network: Network, handle: string, remoteId: string): Promise<SocialPost[]> {
  if (network === "bluesky") {
    const feed = await getJson<{ feed: BskyFeedItem[] }>(
      `${BSKY}/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(remoteId)}&limit=30&filter=posts_no_replies`,
    )
    return feed.feed
      .filter((item) => !item.reason?.$type?.endsWith("reasonRepost") && item.post.author.did === remoteId)
      .map(({ post }) => {
        const facetLinks = (post.record.facets ?? []).flatMap((facet) =>
          (facet.features ?? []).filter((f) => f.$type?.endsWith("#link") && f.uri).map((f) => f.uri!),
        )
        const embedLink = post.embed?.external?.uri ? [post.embed.external.uri] : []
        const rkey = post.uri.split("/").pop()!
        return {
          id: rkey,
          url: `https://bsky.app/profile/${post.author.handle}/post/${rkey}`,
          text: (post.record.text || "").trim(),
          createdAt: new Date(post.record.createdAt || Date.now()).toISOString(),
          likes: post.likeCount ?? 0,
          reposts: (post.repostCount ?? 0) + (post.quoteCount ?? 0),
          replies: post.replyCount ?? 0,
          links: [...new Set([...embedLink, ...facetLinks])],
        }
      })
      // A pinned post comes first in the feed; keep strict newest-first order
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  const host = handle.split("@")[1]
  const statuses = await getJson<MastodonStatus[]>(
    `https://${host}/api/v1/accounts/${encodeURIComponent(remoteId)}/statuses?exclude_replies=true&exclude_reblogs=true&limit=30`,
  )
  return statuses.map((s) => ({
    id: s.id,
    url: s.url || `https://${host}/@${handle.split("@")[0]}/${s.id}`,
    text: htmlToText(s.content),
    createdAt: new Date(s.created_at).toISOString(),
    likes: s.favourites_count ?? 0,
    reposts: s.reblogs_count ?? 0,
    replies: s.replies_count ?? 0,
    links: [...new Set([...(s.card?.url ? [s.card.url] : []), ...linksInHtml(s.content)])],
  }))
}

// Short in-memory cache so a dashboard refreshing every minute does not hammer the networks
const cache = new Map<string, { at: number; value: unknown }>()
async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T
  const value = await load()
  cache.set(key, { at: Date.now(), value })
  if (cache.size > 500) cache.delete(cache.keys().next().value!)
  return value
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

function utcDay(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export async function saveSnapshot(accountId: string, profile: Pick<Profile, "followers" | "posts">) {
  await getDb()
    .insert(schema.socialSnapshots)
    .values({ accountId, day: utcDay(), followers: profile.followers, posts: profile.posts })
    .onConflictDoUpdate({
      target: [schema.socialSnapshots.accountId, schema.socialSnapshots.day],
      set: { followers: profile.followers, posts: profile.posts },
    })
}

// Records today's follower count for every connected account. Run hourly.
export async function snapshotAllAccounts() {
  const accounts = await getDb().select().from(schema.socialAccounts)
  for (const account of accounts) {
    try {
      const profile = await fetchProfile(account.network as Network, account.handle)
      await saveSnapshot(account.id, profile)
    } catch (error) {
      console.error(`Social snapshot failed for ${account.network} ${account.handle}:`, error)
    }
  }
}

// ---------------------------------------------------------------------------
// The overview shown on the dashboard
// ---------------------------------------------------------------------------

export function linksToSite(links: string[], domain: string) {
  return links.some((link) => {
    try {
      const host = normalizeDomain(new URL(link).hostname)
      return host === domain || host.endsWith(`.${domain}`)
    } catch {
      return false
    }
  })
}

export function campaignOf(links: string[], domain: string) {
  for (const link of links) {
    try {
      const url = new URL(link)
      const host = normalizeDomain(url.hostname)
      if ((host === domain || host.endsWith(`.${domain}`)) && url.searchParams.get("utm_campaign")) {
        return url.searchParams.get("utm_campaign")!
      }
    } catch {
      // not a URL
    }
  }
  return null
}

// Which recorded visits came from this account's network
function fromNetwork(network: Network, handle: string) {
  if (network === "bluesky") return sql`network = 'Bluesky'`
  const host = handle.split("@")[1]
  return sql`(network = 'Mastodon' or referrer = ${host})`
}

async function overviewFor(
  site: { id: string; domain: string },
  account: typeof schema.socialAccounts.$inferSelect,
): Promise<AccountOverview> {
  const network = account.network as Network
  const db = getDb()
  let stale = false

  let profile: Profile | null = null
  let posts: SocialPost[] = []
  try {
    ;[profile, posts] = await Promise.all([
      cached(`profile:${account.id}`, 5 * 60_000, () => fetchProfile(network, account.handle)),
      cached(`posts:${account.id}`, 5 * 60_000, () => fetchPosts(network, account.handle, account.remoteId)),
    ])
    await saveSnapshot(account.id, profile)
  } catch (error) {
    console.error(`Social fetch failed for ${network} ${account.handle}:`, error)
    stale = true
  }

  const snapshots = await db
    .select()
    .from(schema.socialSnapshots)
    .where(eq(schema.socialSnapshots.accountId, account.id))
    .orderBy(asc(schema.socialSnapshots.day))
  const latest = snapshots[snapshots.length - 1]
  const weekAgo = utcDay(new Date(Date.now() - 7 * 86_400_000))
  const baseline = [...snapshots].reverse().find((snap) => snap.day <= weekAgo)
  const followers = profile?.followers ?? latest?.followers ?? 0

  const recentPosts = posts.slice(0, 8)
  const oldest = recentPosts.length > 0 ? new Date(recentPosts[recentPosts.length - 1].createdAt) : new Date()
  const since = new Date(Math.min(oldest.getTime(), Date.now() - 7 * 86_400_000))
  const visits = await db
    .select({
      visitorId: schema.pageViews.visitorId,
      createdAt: schema.pageViews.createdAt,
      campaign: schema.pageViews.utmCampaign,
    })
    .from(schema.pageViews)
    .where(and(eq(schema.pageViews.siteId, site.id), gte(schema.pageViews.createdAt, since), fromNetwork(network, account.handle)))

  // Credit each visit to one post: the tagged post with its campaign, otherwise
  // the latest linking post published in the 48 hours before the visit
  const linking = recentPosts
    .map((post) => ({ post, at: new Date(post.createdAt).getTime(), campaign: campaignOf(post.links, site.domain) }))
    .filter(({ post }) => linksToSite(post.links, site.domain))
    .sort((a, b) => a.at - b.at)
  const credited = new Map<string, Set<string>>()
  for (const visit of visits) {
    const at = visit.createdAt.getTime()
    const tagged = visit.campaign ? linking.find((l) => l.campaign === visit.campaign) : undefined
    const match =
      tagged ??
      [...linking].reverse().find((l) => !l.campaign && l.at <= at && at - l.at < POST_WINDOW_MS)
    if (!match) continue
    const set = credited.get(match.post.id) ?? new Set<string>()
    set.add(visit.visitorId)
    credited.set(match.post.id, set)
  }

  const weekStart = Date.now() - 7 * 86_400_000
  const readersThisWeek = new Set(visits.filter((v) => v.createdAt.getTime() >= weekStart).map((v) => v.visitorId)).size

  return {
    id: account.id,
    network,
    networkLabel: NETWORK_LABELS[network],
    handle: account.handle,
    displayName: profile?.displayName ?? account.displayName,
    avatarUrl: profile?.avatarUrl ?? account.avatarUrl,
    profileUrl: account.profileUrl,
    followers,
    posts: profile?.posts ?? latest?.posts ?? 0,
    followerChange: baseline ? followers - baseline.followers : null,
    trackingSince: snapshots[0]?.day ?? utcDay(account.createdAt),
    readersThisWeek,
    recentPosts: recentPosts.map((post) => {
      const linked = linksToSite(post.links, site.domain)
      return { ...post, linksToSite: linked, readers: linked ? (credited.get(post.id)?.size ?? 0) : null }
    }),
    stale,
  }
}

export async function getSocialOverview(site: { id: string; domain: string }): Promise<AccountOverview[]> {
  const accounts = await getDb()
    .select()
    .from(schema.socialAccounts)
    .where(eq(schema.socialAccounts.siteId, site.id))
    .orderBy(asc(schema.socialAccounts.createdAt))
  return Promise.all(accounts.map((account) => overviewFor(site, account)))
}

export async function connectAccount(siteId: string, network: Network, input: string) {
  const handle = parseHandle(network, input)
  if (!handle) {
    return {
      error:
        network === "bluesky"
          ? "Enter a Bluesky handle like yourname.bsky.social"
          : "Enter a Mastodon handle like @you@mastodon.social",
    } as const
  }

  const existing = await getDb().select().from(schema.socialAccounts).where(eq(schema.socialAccounts.siteId, siteId))
  if (existing.length >= MAX_ACCOUNTS_PER_SITE) {
    return { error: `A site can connect up to ${MAX_ACCOUNTS_PER_SITE} accounts` } as const
  }

  let profile: Profile
  try {
    profile = await fetchProfile(network, handle)
  } catch {
    return { error: `Could not find ${handle} on ${NETWORK_LABELS[network]}` } as const
  }

  const [account] = await getDb()
    .insert(schema.socialAccounts)
    .values({
      siteId,
      network,
      handle: profile.handle,
      remoteId: profile.remoteId,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      profileUrl: profile.profileUrl,
    })
    .onConflictDoNothing()
    .returning()
  if (!account) return { error: "That account is already connected" } as const

  await saveSnapshot(account.id, profile)
  return { account } as const
}

export async function disconnectAccount(siteId: string, accountId: string) {
  await getDb()
    .delete(schema.socialAccounts)
    .where(and(eq(schema.socialAccounts.id, accountId), eq(schema.socialAccounts.siteId, siteId)))
}
