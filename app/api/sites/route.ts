import { count, eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/api"
import { getSessionUser } from "@/lib/auth"
import { getDb, schema } from "@/lib/db"
import { getPlan } from "@/lib/plans"
import { isValidDomain, listSites, normalizeDomain } from "@/lib/sites"

export async function GET() {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)
  return NextResponse.json(await listSites(user.id))
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const domain = normalizeDomain(typeof body?.domain === "string" ? body.domain : "")
  const name = (typeof body?.name === "string" ? body.name.trim() : "").slice(0, 80) || domain

  if (!isValidDomain(domain)) {
    return apiError("Enter a valid domain, like example.com", 400)
  }

  const db = getDb()

  const [usage] = await db.select({ plan: schema.usage.plan }).from(schema.usage).where(eq(schema.usage.userId, user.id))
  const [{ total }] = await db.select({ total: count() }).from(schema.sites).where(eq(schema.sites.userId, user.id))
  const { siteLimit } = getPlan(usage?.plan)

  if (total >= siteLimit) {
    return apiError(`Your plan includes up to ${siteLimit} websites`, 403)
  }

  const [site] = await db.insert(schema.sites).values({ userId: user.id, name, domain }).onConflictDoNothing().returning()

  if (!site) {
    return apiError("You have already added this domain", 409)
  }

  return NextResponse.json(site, { status: 201 })
}
