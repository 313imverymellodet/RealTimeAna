import { NextRequest, NextResponse } from "next/server"
import { createCheckoutSession, createStripeCustomer } from "@/lib/stripe-server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json()

    // Get auth header
    const authHeader = request.headers.get("authorization")
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify with Supabase
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      customerId = await createStripeCustomer(user.email || "", user.id)
      await supabase.from("profiles").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
      })
    }

    // Create checkout session
    const origin = request.headers.get("origin") || "https://localhost:3000"
    const checkoutUrl = await createCheckoutSession(
      customerId,
      planId,
      `${origin}/dashboard/billing`,
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
