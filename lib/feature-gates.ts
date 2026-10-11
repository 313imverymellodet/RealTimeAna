import { PLANS } from "@/lib/pricing"

export type Feature = "csv_export" | "custom_events" | "date_range" | "team_members" | "api_access"

interface FeatureConfig {
  minPlan: string
  requiredPlan: string
}

const FEATURE_REQUIREMENTS: Record<Feature, FeatureConfig> = {
  csv_export: { minPlan: "growth", requiredPlan: "Growth" },
  custom_events: { minPlan: "growth", requiredPlan: "Growth" },
  date_range: { minPlan: "growth", requiredPlan: "Growth" },
  team_members: { minPlan: "business", requiredPlan: "Business" },
  api_access: { minPlan: "business", requiredPlan: "Business" },
}

export function canAccessFeature(userPlan: string | undefined, feature: Feature): boolean {
  const userPlanIndex = PLANS.findIndex((p) => p.id === (userPlan || "free"))
  const requiredPlanIndex = PLANS.findIndex((p) => p.id === FEATURE_REQUIREMENTS[feature].minPlan)
  return userPlanIndex >= requiredPlanIndex
}

export function getFeatureRequirement(feature: Feature): FeatureConfig {
  return FEATURE_REQUIREMENTS[feature]
}
