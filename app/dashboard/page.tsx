import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getSessionUser } from "@/lib/auth"
import { listSites } from "@/lib/sites"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ site?: string | string[] }> }) {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login")

  const sites = await listSites(user.id)
  const { site } = await searchParams

  return (
    <DashboardShell
      email={user.email}
      sites={sites.map(({ id, name, domain, publicToken }) => ({ id, name, domain, publicToken }))}
      initialSiteId={typeof site === "string" ? site : null}
    />
  )
}
