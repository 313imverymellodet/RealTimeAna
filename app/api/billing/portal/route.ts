import { NextRequest, NextResponse } from "next/server"
import { getCustomerPortalUrl } from "@/lib/stripe-server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get customer ID
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: "No billing information found" }, { status: 404 })
    }

    // Create portal session
    const origin = request.headers.get("origin") || "https://localhost:3000"
    const portalUrl = await getCustomerPortalUrl(
      profile.stripe_customer_id,
      `${origin}/dashboard/billing`,
    )

    return NextResponse.json({ url: portalUrl })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
