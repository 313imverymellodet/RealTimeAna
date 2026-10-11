import { type NextRequest, NextResponse } from "next/server"
import { apiError, requireOwnedSite } from "@/lib/api"
import { getDb, schema } from "@/lib/db"
import { MAX_FUNNELS_PER_SITE, getFunnelResults, listFunnels, parseSteps } from "@/lib/funnels"
import { parseRange, parseTimeZone } from "@/lib/stats"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOwnedSite((await params).id)
  if ("error" in result) return result.error

  const search = request.nextUrl.searchParams
  return NextResponse.json(
    await getFunnelResults(result.site.id, parseRange(search.get("range")), parseTimeZone(search.get("tz"))),
  )
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOwnedSite((await params).id)
  if ("error" in result) return result.error

  const body = await request.json().catch(() => null)
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 60) : ""
  const steps = parseSteps(body?.steps)

  if (!name) return apiError("Give the funnel a name", 400)
  if (!steps) {
    return apiError("A funnel needs 2 to 6 steps. Pages start with / and goals use letters, numbers, - or _.", 400)
  }

  const existing = await listFunnels(result.site.id)
  if (existing.length >= MAX_FUNNELS_PER_SITE) {
    return apiError(`A website can have up to ${MAX_FUNNELS_PER_SITE} funnels`, 403)
  }

  const [funnel] = await getDb().insert(schema.funnels).values({ siteId: result.site.id, name, steps }).returning()
  return NextResponse.json(funnel, { status: 201 })
}
