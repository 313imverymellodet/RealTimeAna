import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { DashboardView } from "@/components/analytics/dashboard-view"
import { SiteFooter, SiteNav } from "@/components/marketing/site-nav"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Live demo",
  description: "Try the Pulse dashboard without signing up.",
}

export const dynamic = "force-dynamic"

export default function DemoPage() {
  // Set DEMO_SHARE_TOKEN to a site's public link token to show real traffic here
  const token = process.env.DEMO_SHARE_TOKEN
  if (token) redirect(`/share/${token}`)

  return (
    <>
      <SiteNav />
      <main id="main" className="bg-muted">
        <div className="border-b border-border/60 bg-background">
          <p className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground sm:px-6">
            You are looking at the real dashboard running on sample data.
            <Button asChild size="sm" className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
              <Link href="/auth/register">Use it on your site</Link>
            </Button>
          </p>
        </div>
        <DashboardView title="acme.dev" subtitle="Sample data" statsUrl="/api/demo/stats"
          realtimeUrl="/api/demo/realtime"
          funnelsUrl="/api/demo/funnels"
          visitorsUrl="/api/demo/visitors"
        />
      </main>
      <SiteFooter />
    </>
  )
}
