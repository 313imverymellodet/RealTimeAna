"use client"

import { ArrowLeft, Globe2, Link2, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Logo } from "@/components/brand"
import { AccountMenu, type SiteSummary } from "@/components/dashboard/dashboard-shell"
import { CodeBlock, buildSnippet, useOrigin } from "@/components/install-snippet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface PlanSummary {
  name: string
  pageviewLimit: number
  siteLimit: number
  used: number
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-border bg-card shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
      <header className="border-b border-border/70 px-5 py-4">
        <h2 className="font-medium">{title}</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="p-5">{children}</div>
    </section>
  )
}

function SiteRow({ site, onChange, onDelete }: { site: SiteSummary; onChange: (site: SiteSummary) => void; onDelete: () => void }) {
  const [busy, setBusy] = useState(false)
  const [showSnippet, setShowSnippet] = useState(false)
  const origin = useOrigin()
  const shareUrl = site.publicToken ? `${origin}/share/${site.publicToken}` : null

  const setPublic = async (isPublic: boolean) => {
    setBusy(true)
    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public: isPublic }),
      })
      if (!response.ok) throw new Error()
      const updated = await response.json()
      onChange({ ...site, publicToken: updated.publicToken })
      toast.success(isPublic ? "Public dashboard link created" : "Public link turned off")
    } catch {
      toast.error("Could not update sharing")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      const response = await fetch(`/api/sites/${site.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error()
      onDelete()
      toast.success(`${site.domain} deleted`)
    } catch {
      toast.error("Could not delete the website")
      setBusy(false)
    }
  }

  return (
    <li className="rounded-xl border border-border bg-background/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
            <Globe2 className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">{site.domain}</p>
            <button
              type="button"
              onClick={() => setShowSnippet((value) => !value)}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              aria-expanded={showSnippet}
            >
              {showSnippet ? "Hide tracking script" : "Show tracking script"}
            </button>
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon-sm" disabled={busy} aria-label={`Delete ${site.domain}`}>
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {site.domain}?</AlertDialogTitle>
              <AlertDialogDescription>
                All analytics for this website are permanently deleted. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={remove} className="bg-destructive text-white hover:bg-destructive/90">
                Delete website
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {showSnippet && <CodeBlock code={buildSnippet(origin, site.id)} className="mt-4" />}

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/70 pt-4">
        <label htmlFor={`public-${site.id}`} className="text-sm">
          <span className="flex items-center gap-2 font-medium">
            <Link2 className="size-4" />
            Public dashboard
          </span>
          <span className="mt-0.5 block text-muted-foreground">Anyone with the link can view these stats, read-only.</span>
        </label>
        <Switch id={`public-${site.id}`} checked={Boolean(site.publicToken)} onCheckedChange={setPublic} disabled={busy} />
      </div>
      {shareUrl && <CodeBlock code={shareUrl} className="mt-3" />}
    </li>
  )
}

export function SettingsView({ email, sites: initialSites, plan }: { email: string; sites: SiteSummary[]; plan: PlanSummary }) {
  const router = useRouter()
  const [sites, setSites] = useState(initialSites)
  const [deleting, setDeleting] = useState(false)
  const usedPercent = Math.min((plan.used / plan.pageviewLimit) * 100, 100)

  const deleteAccount = async () => {
    setDeleting(true)
    try {
      const response = await fetch("/api/account/delete", { method: "POST" })
      if (!response.ok) throw new Error()
      router.push("/")
      router.refresh()
    } catch {
      toast.error("Could not delete your account")
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-svh bg-muted">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo href="/dashboard" />
          <AccountMenu email={email} />
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Settings</h1>
        </div>

        <Section title="Plan and usage" description={`${plan.name}. Free while Pulse is in beta; no card needed.`}>
          <div className="flex items-baseline justify-between text-sm">
            <span>Pageviews this month</span>
            <span className="tabular font-mono text-muted-foreground">
              {plan.used.toLocaleString("en")} / {plan.pageviewLimit.toLocaleString("en")}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-label="Pageviews used this month"
            aria-valuenow={Math.round(usedPercent)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${usedPercent}%` }} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {sites.length} of {plan.siteLimit} websites used.
          </p>
        </Section>

        <Section title="Websites" description="Tracking scripts, public links and deletion.">
          {sites.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No websites yet.{" "}
              <Link href="/dashboard" className="text-foreground underline underline-offset-4">
                Add one from the dashboard
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-3">
              {sites.map((site) => (
                <SiteRow
                  key={site.id}
                  site={site}
                  onChange={(updated) => setSites((all) => all.map((s) => (s.id === updated.id ? updated : s)))}
                  onDelete={() => setSites((all) => all.filter((s) => s.id !== site.id))}
                />
              ))}
            </ul>
          )}
        </Section>

        <Section title="Account" description={email}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-md text-sm text-muted-foreground">
              Deleting your account permanently removes your login, every website and all of its analytics.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  {deleting ? "Deleting…" : "Delete account"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Your login, websites and all analytics are permanently deleted. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-white hover:bg-destructive/90">
                    Delete account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Section>
      </main>
    </div>
  )
}
