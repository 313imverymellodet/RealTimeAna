"use client"

import { BarChart3 } from "lucide-react"
import Link from "next/link"
import { UserMenu } from "./user-menu"
import type { User } from "@supabase/supabase-js"
import { useAuth } from "@/hooks/use-auth"
import { getPlanLimits } from "@/lib/pricing"

interface DashboardHeaderProps {
  user: User | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const { profile } = useAuth()

  const plan = profile?.plan || "free"
  const { pageviewLimit } = getPlanLimits(plan)
  const pageviewsUsed = profile?.pageviews_this_month || 0
  const percentageUsed = (pageviewsUsed / pageviewLimit) * 100

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-14 items-center justify-between px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <BarChart3 className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">Pulse</span>
        </Link>
        <div className="flex items-center gap-4">
          {/* Plan Badge and Usage Bar */}
          {profile && (
            <div className="flex items-center gap-3 pr-4 border-r border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium px-2 py-1 bg-primary/10 rounded capitalize">
                  {plan}
                </span>
              </div>
              {percentageUsed > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        percentageUsed >= 100 ? "bg-red-500" : percentageUsed >= 80 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{Math.round(percentageUsed)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
        <UserMenu user={user} />
      </div>
    </header>
  )
}
