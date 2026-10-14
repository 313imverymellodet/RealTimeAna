import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { SettingsView } from "@/components/dashboard/settings-view"
import { getSessionUser } from "@/lib/auth"
import { getDb, schema } from "@/lib/db"
import { emailConfigured } from "@/lib/email"
import { getPlan } from "@/lib/plans"
import { listSites } from "@/lib/sites"

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect("/auth/login")

  const [sites, [usage]] = await Promise.all([
    listSites(user.id),
    getDb().select().from(schema.usage).where(eq(schema.usage.userId, user.id)),
  ])

  const plan = getPlan(usage?.plan)
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1))
  const used = usage && usage.periodStart >= monthStart ? usage.pageviews : 0

  return (
    <SettingsView
      userEmail={user.email}
      sites={sites.map(({ id, name, domain, publicToken }) => ({ id, name, domain, publicToken }))}
      plan={{ name: plan.name, pageviewLimit: plan.pageviewLimit, siteLimit: plan.siteLimit, used }}
      email={{
        configured: emailConfigured,
        verified: Boolean(user.emailVerified),
        weeklySummary: usage?.weeklySummary ?? true,
      }}
    />
  )
}
