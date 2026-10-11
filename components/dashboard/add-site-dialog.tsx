"use client"

import type React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Site {
  id: string
  name: string
  domain: string
  created_at: string
  user_id: string
}

interface AddSiteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSiteAdded: (site: Site) => void
}

export function AddSiteDialog({ open, onOpenChange, userId, onSiteAdded }: AddSiteDialogProps) {
  const [name, setName] = useState("")
  const [domain, setDomain] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    // Clean domain (remove protocol and trailing slash)
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/$/, "")

    const { data, error: insertError } = await supabase
      .from("sites")
      .insert({
        name,
        domain: cleanDomain,
        user_id: userId,
      })
      .select()
      .single()

    if (insertError) {
      setError(insertError.message)
      setIsLoading(false)
      return
    }

    onSiteAdded(data)
    setName("")
    setDomain("")
    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add website</DialogTitle>
          <DialogDescription>Enter your website details to start tracking analytics.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Website name</Label>
              <Input
                id="name"
                placeholder="My Website"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Adding..." : "Add website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
