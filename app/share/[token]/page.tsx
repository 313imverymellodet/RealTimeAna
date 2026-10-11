import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { DashboardView } from "@/components/analytics/dashboard-view"
import { Logo } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { getSharedSite } from "@/lib/sites"

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const site = await getSharedSite((await params).token)
  return site ? { title: `${site.domain} live analytics`, robots: { index: false } } : {}
}

export default async function SharedDashboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const site = await getSharedSite(token)
  if (!site) notFound()

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
            <Link href="/auth/register">Get this for your site</Link>
          </Button>
        </div>
      </header>
      <DashboardView
        title={site.domain}
        subtitle="Public dashboard"
        statsUrl={`/api/share/${token}/stats`}
        realtimeUrl={`/api/share/${token}/realtime`}
        funnelsUrl={`/api/share/${token}/funnels`}
      />
    </div>
  )
}
