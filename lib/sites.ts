import "server-only"
import { and, desc, eq } from "drizzle-orm"
import { getDb, schema } from "@/lib/db"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value)
}

// Hostname only: no protocol, path, port or leading "www."
export function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]
    .split(":")[0]
    .replace(/^www\./, "")
}

export function isValidDomain(domain: string) {
  return /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/.test(domain)
}

export async function listSites(userId: string) {
  return getDb().select().from(schema.sites).where(eq(schema.sites.userId, userId)).orderBy(desc(schema.sites.createdAt))
}

export async function getOwnedSite(userId: string, siteId: string) {
  if (!isUuid(siteId)) return null
  const [site] = await getDb()
    .select()
    .from(schema.sites)
    .where(and(eq(schema.sites.id, siteId), eq(schema.sites.userId, userId)))
    .limit(1)
  return site ?? null
}

export async function getSharedSite(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null
  const [site] = await getDb().select().from(schema.sites).where(eq(schema.sites.publicToken, token)).limit(1)
  return site ?? null
}

export type Site = Awaited<ReturnType<typeof listSites>>[number]
