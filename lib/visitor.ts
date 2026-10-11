import "server-only"
import { createHash, randomBytes } from "node:crypto"
import { lt, sql } from "drizzle-orm"
import { getDb, schema } from "@/lib/db"

let cached: { day: string; salt: string } | null = null

function utcDay() {
  return new Date().toISOString().slice(0, 10)
}

// Today's salt, created on first use. Yesterday's and older salts are deleted,
// so a visitor hash can never be recomputed after its day ends.
async function getDailySalt(): Promise<string> {
  const day = utcDay()
  if (cached?.day === day) return cached.salt

  const db = getDb()
  const [row] = await db
    .insert(schema.salts)
    .values({ day, salt: randomBytes(32).toString("hex") })
    // No-op update so RETURNING yields the existing row when another instance won the race
    .onConflictDoUpdate({ target: schema.salts.day, set: { day: sql`excluded.day` } })
    .returning()

  await db.delete(schema.salts).where(lt(schema.salts.day, day))

  cached = { day, salt: row.salt }
  return row.salt
}

// Anonymous visitor id: no cookie or browser storage, different on every site and every day
export async function getVisitorId(siteId: string, ip: string | null, userAgent: string): Promise<string> {
  const salt = await getDailySalt()
  return createHash("sha256").update(`${salt}|${siteId}|${ip || "unknown"}|${userAgent}`).digest("hex").slice(0, 32)
}

// Stable id for a signed-in user a site identifies. Same shape as a visitor id.
export function hashUserId(siteId: string, userId: string): string {
  return createHash("sha256").update(`user|${siteId}|${userId}`).digest("hex").slice(0, 32)
}

export function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()

  let device = "Desktop"
  if (/tablet|ipad/.test(ua)) device = "Tablet"
  else if (/mobile|android|iphone/.test(ua)) device = "Mobile"

  let browser = "Other"
  if (ua.includes("edg/")) browser = "Edge"
  else if (ua.includes("opr/") || ua.includes("opera")) browser = "Opera"
  else if (ua.includes("firefox") || ua.includes("fxios")) browser = "Firefox"
  else if (ua.includes("samsungbrowser")) browser = "Samsung Internet"
  else if (ua.includes("chrome") || ua.includes("crios")) browser = "Chrome"
  else if (ua.includes("safari")) browser = "Safari"

  // iOS and Android user agents also contain "mac" / "linux", so check them first
  let os = "Other"
  if (ua.includes("windows")) os = "Windows"
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS"
  else if (ua.includes("android")) os = "Android"
  else if (ua.includes("cros")) os = "ChromeOS"
  else if (ua.includes("mac")) os = "macOS"
  else if (ua.includes("linux")) os = "Linux"

  return { device, browser, os }
}

const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|pingdom|uptime|monitor|preview|scrape|curl|wget|python|httpclient|phantom/i

export function isBot(userAgent: string) {
  return !userAgent || BOT_RE.test(userAgent)
}
