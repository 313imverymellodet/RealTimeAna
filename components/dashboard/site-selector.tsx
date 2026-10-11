"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Globe, Plus } from "lucide-react"

interface Site {
  id: string
  name: string
  domain: string
}

interface SiteSelectorProps {
  sites: Site[]
  selectedSite: Site | null
  onSelectSite: (site: Site) => void
  onAddSite: () => void
}

export function SiteSelector({ sites, selectedSite, onSelectSite, onAddSite }: SiteSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="font-medium">{selectedSite?.domain || "Select site"}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {sites.map((site) => (
          <DropdownMenuItem key={site.id} onClick={() => onSelectSite(site)} className="flex flex-col items-start">
            <span className="font-medium">{site.name}</span>
            <span className="text-xs text-muted-foreground">{site.domain}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onAddSite}>
          <Plus className="mr-2 h-4 w-4" />
          Add website
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
