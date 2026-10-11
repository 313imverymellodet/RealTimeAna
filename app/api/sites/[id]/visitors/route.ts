import { type NextRequest, NextResponse } from "next/server"
import { requireOwnedSite } from "@/lib/api"
import { listVisitors } from "@/lib/journeys"
import { parseRange, parseTimeZone } from "@/lib/stats"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOwnedSite((await params).id)
  if ("error" in result) return result.error

  const search = request.nextUrl.searchParams
  return NextResponse.json(
    await listVisitors(result.site.id, parseRange(search.get("range")), parseTimeZone(search.get("tz"))),
  )
}
