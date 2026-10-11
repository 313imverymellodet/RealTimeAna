import { randomBytes } from "node:crypto"
import { eq } from "drizzle-orm"
import { type NextRequest, NextResponse } from "next/server"
import { requireOwnedSite } from "@/lib/api"
import { getDb, schema } from "@/lib/db"

// Turn the public, read-only dashboard link on or off
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOwnedSite((await params).id)
  if ("error" in result) return result.error

  const body = await request.json().catch(() => null)
  if (typeof body?.public !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const publicToken = body.public ? (result.site.publicToken ?? randomBytes(18).toString("base64url")) : null

  const [site] = await getDb()
    .update(schema.sites)
    .set({ publicToken })
    .where(eq(schema.sites.id, result.site.id))
    .returning()

  return NextResponse.json(site)
}

// Page views are removed with the site by ON DELETE CASCADE
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await requireOwnedSite((await params).id)
  if ("error" in result) return result.error

  await getDb().delete(schema.sites).where(eq(schema.sites.id, result.site.id))
  return NextResponse.json({ success: true })
}
