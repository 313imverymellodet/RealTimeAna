import { type NextRequest, NextResponse } from "next/server"
import { getDemoStats } from "@/lib/demo-data"
import { parseRange } from "@/lib/stats"

export function GET(request: NextRequest) {
  return NextResponse.json(getDemoStats(parseRange(request.nextUrl.searchParams.get("range"))))
}
