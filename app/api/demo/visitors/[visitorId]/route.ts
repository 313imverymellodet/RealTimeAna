import { NextResponse } from "next/server"
import { getDemoJourney } from "@/lib/demo-data"

export const dynamic = "force-dynamic"

export async function GET(_request: Request, { params }: { params: Promise<{ visitorId: string }> }) {
  return NextResponse.json(getDemoJourney((await params).visitorId))
}
