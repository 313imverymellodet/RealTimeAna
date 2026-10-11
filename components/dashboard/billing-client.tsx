"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PLANS } from "@/lib/pricing"
import { Check, Loader2 } from "lucide-react"
import { useAsyncCallback } from "@/hooks/use-async-callback"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

export function BillingClient() {
  const { user, profile } = useAuth()
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<"monthly" | "yearly">("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const { execute: handleUpgrade } = useAsyncCallback(async (planId: string) => {
    setLoadingPlan(planId)
    try {
      const token = localStorage.getItem("sb-token") // Get from your auth setup
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ planId }),
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error("Failed to create checkout session")
      }
    } catch (error) {
      toast.error("Error initiating checkout")
      console.error(error)
    } finally {
      setLoadingPlan(null)
    }
  })

  const currentPlan = PLANS.find((p) => p.id === (profile?.plan || "free"))

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">You are currently on the</p>
            <p className="text-2xl font-bold">{currentPlan?.name} Plan</p>
            <p className="text-sm text-muted-foreground mt-1">${currentPlan?.priceMonthly}/month</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">Manage Plan</Link>
          </Button>
        </div>
      </Card>

      {/* Usage */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Monthly Usage</h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Pageviews</span>
              <span className="text-sm text-muted-foreground">
                {profile?.pageviews_this_month || 0} / {currentPlan?.pageviewLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((profile?.pageviews_this_month || 0) / (currentPlan?.pageviewLimit || 1)) * 100,
                    100,
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Upgrade Your Plan</h2>
          <Tabs defaultValue="monthly" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="monthly" onClick={() => setSelectedBillingCycle("monthly")}>
                Monthly Billing
              </TabsTrigger>
              <TabsTrigger value="yearly" onClick={() => setSelectedBillingCycle("yearly")}>
                Yearly Billing (Save 20%)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <Card key={plan.id} className={`p-6 flex flex-col ${plan.highlighted ? "border-primary" : ""}`}>
                  <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">${plan.priceMonthly}</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={profile?.plan === plan.id || loadingPlan === plan.id}
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : profile?.plan === plan.id ? (
                      "Current Plan"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="yearly" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLANS.map((plan) => (
                <Card key={plan.id} className={`p-6 flex flex-col ${plan.highlighted ? "border-primary" : ""}`}>
                  <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold">${plan.priceYearly}</span>
                    <span className="text-muted-foreground">/year</span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={profile?.plan === plan.id || loadingPlan === plan.id}
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : profile?.plan === plan.id ? (
                      "Current Plan"
                    ) : (
                      "Upgrade"
                    )}
                  </Button>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
