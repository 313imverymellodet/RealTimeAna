import { type NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getDb, schema } from "@/lib/db"

// Turn the weekly summary email on or off
export async function PATCH(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (typeof body?.weeklySummary !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  await getDb()
    .insert(schema.usage)
    .values({ userId: user.id, pageviews: 0, weeklySummary: body.weeklySummary })
    .onConflictDoUpdate({ target: schema.usage.userId, set: { weeklySummary: body.weeklySummary } })

  return NextResponse.json({ weeklySummary: body.weeklySummary })
}
