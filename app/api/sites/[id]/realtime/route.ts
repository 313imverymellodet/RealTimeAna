import { NextResponse } from "next/server"
import { requireOwnedSite } from "@/lib/api"
import { getRealtime } from "@/lib/stats"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOwnedSite((await params).id)
  if ("error" in result) return result.error

  return NextResponse.json(await getRealtime(result.site.id))
}
