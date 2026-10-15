import { NextResponse } from "next/server"
import { apiError, requireOwnedSite } from "@/lib/api"
import { isUuid } from "@/lib/sites"
import { disconnectAccount } from "@/lib/social"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; accountId: string }> }) {
  const { id, accountId } = await params
  const result = await requireOwnedSite(id)
  if ("error" in result) return result.error
  if (!isUuid(accountId)) return apiError("Account not found", 404)

  await disconnectAccount(result.site.id, accountId)
  return NextResponse.json({ success: true })
}
