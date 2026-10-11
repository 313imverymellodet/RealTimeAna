import { NextResponse } from "next/server"
import { getDemoVisitors } from "@/lib/demo-data"

export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json(getDemoVisitors())
}
