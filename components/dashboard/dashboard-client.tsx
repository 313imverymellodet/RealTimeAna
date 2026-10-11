"use client"

import { useState } from "react"
import type { User } from "@supabase/supabase-js"
import { SiteSelector } from "./site-selector"
import { AddSiteDialog } from "./add-site-dialog"
import { AnalyticsView } from "./analytics-view"
import { EmptyState } from "./empty-state"
import { OnboardingFlow } from "./onboarding-flow"

interface Site {
  id: string
  name: string
  domain: string
  created_at: string
  user_id: string
}

interface DashboardClientProps {
  user: User
  sites: Site[]
}

export function DashboardClient({ user, sites: initialSites }: DashboardClientProps) {
  const [sites, setSites] = useState<Site[]>(initialSites)
  const [selectedSite, setSelectedSite] = useState<Site | null>(sites[0] || null)
  const [showAddSite, setShowAddSite] = useState(false)
  const [newlyAddedSite, setNewlyAddedSite] = useState<Site | null>(null)

  const handleSiteAdded = (site: Site) => {
    setSites([site, ...sites])
    setSelectedSite(site)
    setShowAddSite(false)
    setNewlyAddedSite(site)
  }

  const handleOnboardingComplete = () => {
    setNewlyAddedSite(null)
  }

  if (sites.length === 0) {
    return (
      <>
        <EmptyState onAddSite={() => setShowAddSite(true)} />
        <AddSiteDialog
          open={showAddSite}
          onOpenChange={setShowAddSite}
          userId={user.id}
          onSiteAdded={handleSiteAdded}
        />
      </>
    )
  }

  if (newlyAddedSite) {
    return <OnboardingFlow site={newlyAddedSite} onComplete={handleOnboardingComplete} />
  }

  return (
    <>
      <div className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-3">
          <SiteSelector
            sites={sites}
            selectedSite={selectedSite}
            onSelectSite={setSelectedSite}
            onAddSite={() => setShowAddSite(true)}
          />
        </div>
      </div>
      {selectedSite && <AnalyticsView site={selectedSite} />}
      <AddSiteDialog open={showAddSite} onOpenChange={setShowAddSite} userId={user.id} onSiteAdded={handleSiteAdded} />
    </>
  )
}
