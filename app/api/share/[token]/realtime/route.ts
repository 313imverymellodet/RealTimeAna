import { NextResponse } from "next/server"
import { requireSharedSite } from "@/lib/api"
import { getRealtime } from "@/lib/stats"

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const result = await requireSharedSite((await params).token)
  if ("error" in result) return result.error

  return NextResponse.json(await getRealtime(result.site.id))
}
