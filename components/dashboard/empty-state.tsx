"use client"

import { Button } from "@/components/ui/button"
import { BarChart3, Plus } from "lucide-react"

interface EmptyStateProps {
  onAddSite: () => void
}

export function EmptyState({ onAddSite }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-6">
        <BarChart3 className="h-8 w-8 text-primary" />
      </div>
      <h2 className="text-2xl font-semibold mb-2">Add your first website</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Start tracking your website analytics by adding your first site. You&apos;ll get a tracking script to install.
      </p>
      <Button onClick={onAddSite} size="lg">
        <Plus className="mr-2 h-4 w-4" />
        Add website
      </Button>
    </div>
  )
}
