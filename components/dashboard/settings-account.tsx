"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useAsyncCallback } from "@/hooks/use-async-callback"
import { toast } from "sonner"
import { Loader2, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function SettingsClient() {
  const router = useRouter()
  const { user, profile } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSignOut = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      toast.error("Failed to sign out")
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure? This will permanently delete your account and all data.")) {
      return
    }

    try {
      setIsUpdating(true)
      const supabase = createClient()

      // Delete user auth (this cascades to delete other data)
      const { error } = await supabase.auth.admin.deleteUser(user?.id!)

      if (error) throw error

      toast.success("Account deleted successfully")
      router.push("/")
    } catch (error) {
      toast.error("Failed to delete account")
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="account" className="w-full">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input type="email" value={user.email || ""} disabled className="bg-secondary" />
              </div>
              <div>
                <Label>Member Since</Label>
                <Input
                  type="text"
                  value={
                    user.created_at
                      ? new Date(user.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""
                  }
                  disabled
                  className="bg-secondary"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Session Management</h3>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </Card>

          <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <h3 className="text-lg font-semibold mb-2 text-red-900 dark:text-red-100">Danger Zone</h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </Button>
          </Card>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Current Plan</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-2xl font-bold capitalize">{profile?.plan || "free"}</p>
              </div>
              <Button asChild>
                <Link href="/dashboard/billing">Manage Billing</Link>
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
