import { type NextRequest, NextResponse } from "next/server"
import { getDb, schema } from "@/lib/db"
import { verifyUnsubscribe } from "@/lib/email"

// One-click opt-out from the weekly summary, reached from the link in the email
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("u") || ""
  const token = request.nextUrl.searchParams.get("t") || ""

  if (!userId || !verifyUnsubscribe(userId, token)) {
    return new NextResponse("This link is not valid.", { status: 400 })
  }

  await getDb()
    .insert(schema.usage)
    .values({ userId, pageviews: 0, weeklySummary: false })
    .onConflictDoUpdate({ target: schema.usage.userId, set: { weeklySummary: false } })
    .catch(() => {})

  return new NextResponse(
    "You will no longer get the weekly summary. You can turn it back on in Settings.",
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  )
}
