import { type NextRequest, NextResponse } from "next/server"
import { apiError, requireOwnedSite } from "@/lib/api"
import { connectAccount, getSocialOverview, type Network } from "@/lib/social"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOwnedSite((await params).id)
  if ("error" in result) return result.error

  return NextResponse.json(await getSocialOverview(result.site))
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOwnedSite((await params).id)
  if ("error" in result) return result.error

  const body = await request.json().catch(() => null)
  const network = body?.network as Network
  if ((network !== "bluesky" && network !== "mastodon") || typeof body?.handle !== "string") {
    return apiError("Choose a network and enter a handle", 400)
  }

  const connected = await connectAccount(result.site.id, network, body.handle)
  if ("error" in connected) return apiError(connected.error!, 400)
  return NextResponse.json(connected.account, { status: 201 })
}
