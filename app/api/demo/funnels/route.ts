import { type NextRequest, NextResponse } from "next/server"
import { getDemoFunnels } from "@/lib/demo-data"
import { parseRange } from "@/lib/stats"

export function GET(request: NextRequest) {
  return NextResponse.json(getDemoFunnels(parseRange(request.nextUrl.searchParams.get("range"))))
}
