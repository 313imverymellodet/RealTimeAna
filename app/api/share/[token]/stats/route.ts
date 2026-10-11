import { type NextRequest, NextResponse } from "next/server"
import { requireSharedSite } from "@/lib/api"
import { getStats, parseRange, parseTimeZone } from "@/lib/stats"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const result = await requireSharedSite((await params).token)
  if ("error" in result) return result.error

  const search = request.nextUrl.searchParams
  const stats = await getStats(result.site.id, parseRange(search.get("range")), parseTimeZone(search.get("tz")))
  return NextResponse.json(stats)
}
