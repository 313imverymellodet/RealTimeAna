// Payments are not live yet: every account is on the free beta plan.
// Add paid plans here when Stripe is wired back in.

export interface Plan {
  id: string
  name: string
  pageviewLimit: number
  siteLimit: number
}

export const BETA_PLAN: Plan = {
  id: "beta",
  name: "Free beta",
  pageviewLimit: 100_000,
  siteLimit: 10,
}

const PLANS: Record<string, Plan> = {
  [BETA_PLAN.id]: BETA_PLAN,
}

export function getPlan(planId: string | null | undefined): Plan {
  return (planId && PLANS[planId]) || BETA_PLAN
}
