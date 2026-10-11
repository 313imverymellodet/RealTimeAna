import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClient } from "@/components/dashboard/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's sites
  const { data: sites } = await supabase.from("sites").select("*").order("created_at", { ascending: false })

  return <DashboardClient user={user} sites={sites || []} />
}
