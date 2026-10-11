import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"
import { getSessionUser } from "@/lib/auth"
import { listSites } from "@/lib/sites"

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login")

  const sites = await listSites(user.id)

  return (
    <DashboardShell
      email={user.email}
      sites={sites.map(({ id, name, domain, publicToken }) => ({ id, name, domain, publicToken }))}
    />
  )
}
