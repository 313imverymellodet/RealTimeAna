"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { UpgradeModal } from "./upgrade-modal"
import type { Feature } from "@/lib/feature-gates"
import { canAccessFeature, getFeatureRequirement } from "@/lib/feature-gates"
import { useAuth } from "@/hooks/use-auth"

interface RestrictedFeatureProps {
  feature: Feature
  featureLabel: string
  children: React.ReactNode
}

export function RestrictedFeature({ feature, featureLabel, children }: RestrictedFeatureProps) {
  const { profile } = useAuth()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const hasAccess = canAccessFeature(profile?.plan, feature)

  if (!hasAccess) {
    const requirement = getFeatureRequirement(feature)
    return (
      <>
        <div className="p-4 border border-dashed rounded-lg bg-muted/50 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{featureLabel} is not available</p>
            <p className="text-xs text-muted-foreground">Upgrade to {requirement.requiredPlan} plan to use this feature</p>
          </div>
          <Button size="sm" onClick={() => setShowUpgradeModal(true)}>
            Upgrade
          </Button>
        </div>
        <UpgradeModal
          open={showUpgradeModal}
          onOpenChange={setShowUpgradeModal}
          feature={featureLabel}
          requiredPlan={requirement.requiredPlan}
        />
      </>
    )
  }

  return <>{children}</>
}
