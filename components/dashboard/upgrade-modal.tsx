"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature: string
  requiredPlan: string
}

export function UpgradeModal({ open, onOpenChange, feature, requiredPlan }: UpgradeModalProps) {
  const router = useRouter()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            The {feature} feature is available on the {requiredPlan} plan and above.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button onClick={() => router.push("/dashboard/billing")}>
            View Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
