"use client"

import { useState } from "react"
import { CodeBlock } from "@/components/install-snippet"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LINK_NETWORKS } from "@/lib/channels"

function slug(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

// Builds a tagged link for one post, so the dashboard can show what that post brought in
export function buildTrackedLink(domain: string, page: string, network: string, label: string) {
  let url: URL
  try {
    url = new URL(/^https?:\/\//.test(page) ? page : `https://${domain}${page.startsWith("/") ? page : `/${page}`}`)
  } catch {
    return ""
  }
  url.searchParams.set("utm_source", network)
  url.searchParams.set("utm_medium", network === "newsletter" ? "email" : "social")
  const campaign = slug(label)
  if (campaign) url.searchParams.set("utm_campaign", campaign)
  return url.toString()
}

export function LinkBuilder({
  open,
  onOpenChange,
  domain,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  domain: string
}) {
  const [page, setPage] = useState("/")
  const [network, setNetwork] = useState("x")
  const [label, setLabel] = useState("")
  const link = buildTrackedLink(domain, page, network, label)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tracked link</DialogTitle>
          <DialogDescription>
            Post this link instead of the plain one. Readers who arrive through it are counted under the network and
            the post name, along with any signups and revenue.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="link-page">Page to share</Label>
            <Input
              id="link-page"
              value={page}
              onChange={(event) => setPage(event.target.value)}
              placeholder="/news/my-story"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="url"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="link-network">Where you will post it</Label>
              <Select value={network} onValueChange={setNetwork}>
                <SelectTrigger id="link-network">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_NETWORKS.map(([value, name]) => (
                    <SelectItem key={value} value={value}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="link-label">Post name (optional)</Label>
              <Input
                id="link-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="budget-vote-thread"
                maxLength={60}
              />
            </div>
          </div>

          {link ? (
            <CodeBlock code={link} />
          ) : (
            <p role="alert" className="text-sm text-red-600">
              Enter a page path like /news/my-story or a full address.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
