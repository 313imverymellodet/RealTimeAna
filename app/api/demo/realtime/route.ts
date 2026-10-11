import { NextResponse } from "next/server"
import { getDemoRealtime } from "@/lib/demo-data"

export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json(getDemoRealtime())
}
