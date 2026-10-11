import "server-only"

import Stripe from "stripe"
import { stripe as stripeInstance } from "@/lib/stripe"
import { PLANS } from "@/lib/pricing"

// Get or create Stripe price for a plan
export async function getOrCreatePrice(planId: string): Promise<string> {
  const plan = PLANS.find((p) => p.id === planId)
  if (!plan) throw new Error(`Plan not found: ${planId}`)

  const prices = await stripeInstance.prices.list({
    lookup_keys: [planId],
    expand: ["data.product"],
  })

  if (prices.data.length > 0) {
    return prices.data[0].id
  }

  // Create new price
  const product = await stripeInstance.products.create({
    name: plan.name,
    description: plan.description,
    metadata: { planId },
  })

  const price = await stripeInstance.prices.create({
    product: product.id,
    unit_amount: plan.priceMonthly * 100,
    currency: "usd",
    type: "recurring",
    recurring: {
      interval: "month",
      interval_count: 1,
    },
    lookup_key: planId,
  })

  return price.id
}

// Create checkout session
export async function createCheckoutSession(
  customerId: string,
  planId: string,
  returnUrl: string,
): Promise<string> {
  const priceId = await getOrCreatePrice(planId)

  const session = await stripeInstance.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: returnUrl,
  })

  if (!session.url) throw new Error("Failed to create checkout session")
  return session.url
}

// Create Stripe customer
export async function createStripeCustomer(email: string, userId: string): Promise<string> {
  const customer = await stripeInstance.customers.create({
    email,
    metadata: { userId },
  })
  return customer.id
}

// Get customer portal session
export async function getCustomerPortalUrl(customerId: string, returnUrl: string): Promise<string> {
  const session = await stripeInstance.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

// Verify webhook signature
export function verifyWebhookSignature(body: string, signature: string, secret: string): Stripe.Event {
  return stripeInstance.webhooks.constructEvent(body, signature, secret)
}
