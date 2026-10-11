export interface PricingPlan {
  id: string
  name: string
  description: string
  priceMonthly: number
  priceYearly: number
  pageviewLimit: number
  siteLimit: number
  features: string[]
  highlighted?: boolean
}

export const PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    description: "For personal projects and testing",
    priceMonthly: 0,
    priceYearly: 0,
    pageviewLimit: 1000,
    siteLimit: 1,
    features: [
      "1,000 pageviews/month",
      "1 website",
      "7 days data retention",
      "Basic analytics",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    description: "For small websites and blogs",
    priceMonthly: 9,
    priceYearly: 90,
    pageviewLimit: 10000,
    siteLimit: 3,
    features: [
      "10,000 pageviews/month",
      "3 websites",
      "30 days data retention",
      "Full analytics dashboard",
      "Email reports",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing businesses",
    priceMonthly: 29,
    priceYearly: 290,
    pageviewLimit: 100000,
    siteLimit: 10,
    highlighted: true,
    features: [
      "100,000 pageviews/month",
      "10 websites",
      "1 year data retention",
      "Advanced analytics",
      "Custom events",
      "CSV export",
      "Priority support",
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "For high-traffic sites",
    priceMonthly: 79,
    priceYearly: 790,
    pageviewLimit: 1000000,
    siteLimit: 50,
    features: [
      "1,000,000 pageviews/month",
      "50 websites",
      "Unlimited data retention",
      "All Growth features",
      "API access",
      "Team members",
      "Dedicated support",
    ],
  },
]

export function getPlanById(planId: string): PricingPlan | undefined {
  return PLANS.find((plan) => plan.id === planId)
}

export function getPlanLimits(planId: string): { pageviewLimit: number; siteLimit: number } {
  const plan = getPlanById(planId)
  return {
    pageviewLimit: plan?.pageviewLimit ?? 1000,
    siteLimit: plan?.siteLimit ?? 1,
  }
}

export function formatPageviews(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(count % 1000000 === 0 ? 0 : 1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}K`
  }
  return count.toString()
}
