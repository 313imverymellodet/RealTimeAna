import "server-only"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getOwnedSite, getSharedSite } from "@/lib/sites"

export function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

// Resolves the site for a signed-in owner, or returns the error response to send
export async function requireOwnedSite(siteId: string) {
  const user = await getSessionUser()
  if (!user) return { error: apiError("Unauthorized", 401) } as const
  const site = await getOwnedSite(user.id, siteId)
  if (!site) return { error: apiError("Site not found", 404) } as const
  return { user, site } as const
}

export async function requireSharedSite(token: string) {
  const site = await getSharedSite(token)
  if (!site) return { error: apiError("Not found", 404) } as const
  return { site } as const
}
