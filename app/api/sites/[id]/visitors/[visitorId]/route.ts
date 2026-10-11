import { NextResponse } from "next/server"
import { apiError, requireOwnedSite } from "@/lib/api"
import { getJourney, isVisitorId } from "@/lib/journeys"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; visitorId: string }> }) {
  const { id, visitorId } = await params
  const result = await requireOwnedSite(id)
  if ("error" in result) return result.error
  if (!isVisitorId(visitorId)) return apiError("Visitor not found", 404)

  return NextResponse.json(await getJourney(result.site.id, visitorId))
}
