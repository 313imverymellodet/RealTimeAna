import { NextResponse } from "next/server"
import { getDemoSocial } from "@/lib/demo-data"

export function GET() {
  return NextResponse.json(getDemoSocial())
}
