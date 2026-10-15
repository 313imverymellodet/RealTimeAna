"use client"

import { ChevronsUpDown, Globe2, LogOut, Plus, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { DashboardView } from "@/components/analytics/dashboard-view"
import { Logo } from "@/components/brand"
import { InstallPanel } from "@/components/dashboard/install-panel"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

export interface SiteSummary {
  id: string
  name: string
  domain: string
  publicToken: string | null
}

export function AccountMenu({ email }: { email: string }) {
  const router = useRouter()

  const signOut = async () => {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label="Account menu">
          <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-xs font-medium uppercase">
            {email.slice(0, 1)}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AddSiteDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (site: SiteSummary) => void
}) {
  const [domain, setDomain] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Could not add the website")
        return
      }
      setDomain("")
      onAdded(data)
    } catch {
      setError("Could not reach the server. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add a website</DialogTitle>
            <DialogDescription>Enter the domain you want to track. Subdomains are included.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-5">
            <Label htmlFor="site-domain">Domain</Label>
            <Input
              id="site-domain"
              name="domain"
              placeholder="example.com"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
              value={domain}
              onChange={(event) => setDomain(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "site-domain-error" : undefined}
              required
            />
            {error && (
              <p id="site-domain-error" role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function DashboardShell({ email, sites: initialSites }: { email: string; sites: SiteSummary[] }) {
  const [sites, setSites] = useState(initialSites)
  const [selectedId, setSelectedId] = useState<string | null>(initialSites[0]?.id ?? null)
  const [adding, setAdding] = useState(false)

  const selected = sites.find((site) => site.id === selectedId) ?? sites[0] ?? null

  const handleAdded = (site: SiteSummary) => {
    setSites((current) => [site, ...current])
    setSelectedId(site.id)
    setAdding(false)
    toast.success(`${site.domain} added`)
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Logo href="/dashboard" />
            {selected && (
              <>
                <span className="text-border" aria-hidden>
                  /
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="min-w-0 gap-1.5 px-2">
                      <span className="truncate">{selected.domain}</span>
                      <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Websites</DropdownMenuLabel>
                    {sites.map((site) => (
                      <DropdownMenuItem key={site.id} onClick={() => setSelectedId(site.id)}>
                        <Globe2 className="size-4" />
                        <span className="truncate">{site.domain}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setAdding(true)}>
                      <Plus className="size-4" />
                      Add website
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
          <AccountMenu email={email} />
        </div>
      </header>

      <main>
        {selected ? (
          <DashboardView
            key={selected.id}
            title={selected.name}
            subtitle={selected.name === selected.domain ? undefined : selected.domain}
            statsUrl={`/api/sites/${selected.id}/stats`}
            realtimeUrl={`/api/sites/${selected.id}/realtime`}
            funnelsUrl={`/api/sites/${selected.id}/funnels`}
            canEditFunnels
            siteDomain={selected.domain}
            socialUrl={`/api/sites/${selected.id}/social`}
            canEditSocial
            visitorsUrl={`/api/sites/${selected.id}/visitors`}
            emptyState={<InstallPanel siteId={selected.id} domain={selected.domain} />}
          />
        ) : (
          <div className="mx-auto flex min-h-[70svh] max-w-md flex-col items-center justify-center px-6 text-center">
            <span className="flex size-12 items-center justify-center rounded-3xl border border-border bg-card shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
              <Globe2 className="size-5 text-brand-ink" />
            </span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">Add your first website</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              It takes about a minute: enter your domain, paste one script tag, and watch visits arrive live.
            </p>
            <Button className="mt-6" onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Add website
            </Button>
          </div>
        )}
      </main>

      <AddSiteDialog open={adding} onOpenChange={setAdding} onAdded={handleAdded} />
    </div>
  )
}
