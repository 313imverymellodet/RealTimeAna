import { type NextRequest, NextResponse } from "next/server"
import { apiError } from "@/lib/api"
import { getSessionUser } from "@/lib/auth"
import { getOverview } from "@/lib/overview"
import { listSites } from "@/lib/sites"
import { parseRange, parseTimeZone } from "@/lib/stats"

// Every site the signed-in owner has, merged into one view
export async function GET(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return apiError("Unauthorized", 401)

  const sites = await listSites(user.id)
  const search = request.nextUrl.searchParams
  return NextResponse.json(
    await getOverview(
      sites.map(({ id, name, domain }) => ({ id, name, domain })),
      parseRange(search.get("range")),
      parseTimeZone(search.get("tz")),
    ),
  )
}
