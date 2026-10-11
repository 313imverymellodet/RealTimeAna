import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { apiError, requireOwnedSite } from "@/lib/api"
import { getDb, schema } from "@/lib/db"
import { isUuid } from "@/lib/sites"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; funnelId: string }> }) {
  const { id, funnelId } = await params
  const result = await requireOwnedSite(id)
  if ("error" in result) return result.error
  if (!isUuid(funnelId)) return apiError("Funnel not found", 404)

  await getDb()
    .delete(schema.funnels)
    .where(and(eq(schema.funnels.id, funnelId), eq(schema.funnels.siteId, result.site.id)))

  return NextResponse.json({ success: true })
}
