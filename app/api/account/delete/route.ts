import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { getAuth, getSessionUser } from "@/lib/auth"
import { getDb, schema } from "@/lib/db"

// Permanently deletes the signed-in user. Sessions, sites, page views and usage
// are removed by ON DELETE CASCADE.
export async function POST() {
  try {
    const user = await getSessionUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await getDb().delete(schema.user).where(eq(schema.user.id, user.id))

    // Clears the now-orphaned session cookie
    await getAuth()
      .api.signOut({ headers: await headers() })
      .catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Account delete error:", error)
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
