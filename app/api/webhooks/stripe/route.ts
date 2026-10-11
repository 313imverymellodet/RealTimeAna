import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        // Get customer to find userId
        const customer = await stripe.customers.retrieve(customerId)
        const userId = (customer.metadata as any)?.userId

        if (userId) {
          // Determine plan from price
          const subscription_items = subscription.items.data
          const priceId = subscription_items[0]?.price.id

          let planId = "free"
          if (priceId) {
            const price = await stripe.prices.retrieve(priceId)
            planId = (price.lookup_key as string) || "free"
          }

          // Update user profile with subscription info
          await supabase.from("profiles").upsert({
            user_id: userId,
            plan: planId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            pageviews_this_month: 0,
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any
        const customerId = subscription.customer

        // Get customer to find userId
        const customer = await stripe.customers.retrieve(customerId)
        const userId = (customer.metadata as any)?.userId

        if (userId) {
          // Revert to free plan
          await supabase.from("profiles").update({
            plan: "free",
            subscription_status: "canceled",
          }).eq("user_id", userId)
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any
        // Could trigger email, logging, analytics here
        console.log("Payment succeeded:", invoice.id)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any
        // Could send retry notification to user
        console.log("Payment failed:", invoice.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
