"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true)

  const price = isAnnual ? 9 : 12

  const features = [
    "10,000 monthly events",
    "Unlimited websites",
    "Real-time analytics",
    "Experience Score tracking",
    "Core Web Vitals",
    "Forever data retention",
    "Email reports",
    "API access",
  ]

  return (
    <section id="pricing" className="py-20 px-4 bg-muted/30">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
            Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Simplified pricing</h2>
          <p className="text-muted-foreground">
            Our pricing is simple and transparent, you just pay for the amount of events you need each cycle.
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8 p-1 bg-muted rounded-full w-fit mx-auto">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              !isAnnual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
              isAnnual ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Annually
            <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/20">
              -20%
            </Badge>
          </button>
        </div>

        <Card className="border shadow-lg overflow-hidden">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <p className="text-sm text-muted-foreground mb-2">Per month</p>
              <div className="flex items-start justify-center gap-1">
                <span className="text-2xl font-medium mt-2">$</span>
                <span className="text-6xl font-bold tracking-tight">{price}</span>
              </div>
              {isAnnual && <p className="text-sm text-muted-foreground mt-2">Billed annually (${price * 12}/year)</p>}
            </div>

            <div className="space-y-3 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>

            <Button asChild className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground py-6">
              <Link href="/auth/register">Start 14 day free trial</Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground mt-4">No credit card required</p>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
