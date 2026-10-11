import { type NextRequest, NextResponse } from "next/server"
import { requireSharedSite } from "@/lib/api"
import { getFunnelResults } from "@/lib/funnels"
import { parseRange, parseTimeZone } from "@/lib/stats"

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const result = await requireSharedSite((await params).token)
  if ("error" in result) return result.error

  const search = request.nextUrl.searchParams
  return NextResponse.json(
    await getFunnelResults(result.site.id, parseRange(search.get("range")), parseTimeZone(search.get("tz"))),
  )
}
