"use client"

import { ArrowUpRight, Heart, Link2, MessageCircle, Plus, Repeat2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatNumber } from "@/lib/format"
import type { AccountOverview, PostWithReaders } from "@/lib/social"
import { Panel, Segmented } from "./primitives"
import { usePolling } from "./use-polling"

type Network = "bluesky" | "mastodon"

const socialDelay = () => 5 * 60_000

const NETWORK_STYLE: Record<Network, { color: string; placeholder: string }> = {
  bluesky: { color: "#1185fe", placeholder: "yourname.bsky.social" },
  mastodon: { color: "#6364ff", placeholder: "@you@mastodon.social" },
}

function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes}m`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`
  return `${Math.floor(minutes / (60 * 24))}d`
}

function Avatar({ account }: { account: AccountOverview }) {
  const color = NETWORK_STYLE[account.network].color
  return account.avatarUrl ? (
    // External avatar from the network's own CDN
    // eslint-disable-next-line @next/next/no-img-element
    <img src={account.avatarUrl} alt="" className="size-11 shrink-0 rounded-full object-cover" />
  ) : (
    <span
      aria-hidden
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{ background: color }}
    >
      {(account.displayName || account.handle).slice(0, 1).toUpperCase()}
    </span>
  )
}

function Post({ post }: { post: PostWithReaders }) {
  return (
    <li className="flex gap-4 border-t border-border/60 py-3 first:border-t-0">
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-relaxed">{post.text || "(no text)"}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <a href={post.url} target="_blank" rel="noreferrer" className="hover:text-foreground hover:underline">
            {timeAgo(post.createdAt)} ago
          </a>
          <span className="tabular flex items-center gap-1" title="Likes">
            <Heart className="size-3" aria-hidden />
            {formatNumber(post.likes)}
            <span className="sr-only">likes</span>
          </span>
          <span className="tabular flex items-center gap-1" title="Reposts and quotes">
            <Repeat2 className="size-3" aria-hidden />
            {formatNumber(post.reposts)}
            <span className="sr-only">reposts</span>
          </span>
          <span className="tabular flex items-center gap-1" title="Replies">
            <MessageCircle className="size-3" aria-hidden />
            {formatNumber(post.replies)}
            <span className="sr-only">replies</span>
          </span>
        </p>
      </div>
      <div className="w-24 shrink-0 text-right">
        {post.readers !== null ? (
          <>
            <p className="tabular text-lg leading-none font-semibold">{formatNumber(post.readers)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">readers sent</p>
          </>
        ) : (
          <p className="pt-0.5 text-[11px] text-muted-foreground">No link to your site</p>
        )}
      </div>
    </li>
  )
}

function AccountCard({
  account,
  canEdit,
  onDisconnect,
}: {
  account: AccountOverview
  canEdit: boolean
  onDisconnect: () => void
}) {
  const linking = account.recentPosts.filter((post) => post.linksToSite)
  const sent = linking.reduce((sum, post) => sum + (post.readers ?? 0), 0)

  return (
    <article className="rounded-2xl border border-border p-4">
      <header className="flex items-start gap-3">
        <Avatar account={account} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{account.displayName || account.handle}</p>
          <a
            href={account.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 truncate text-xs text-muted-foreground hover:text-foreground"
          >
            <span className="size-2 shrink-0 rounded-full" style={{ background: NETWORK_STYLE[account.network].color }} aria-hidden />
            {account.networkLabel} · @{account.handle}
            <ArrowUpRight className="size-3 shrink-0" aria-hidden />
          </a>
        </div>
        {canEdit && (
          <Button variant="ghost" size="icon-sm" onClick={onDisconnect} aria-label={`Disconnect ${account.handle}`}>
            <X className="size-4" />
          </Button>
        )}
      </header>

      <dl className="mt-4 grid grid-cols-3 gap-3">
        <div>
          <dt className="text-xs text-muted-foreground">Followers</dt>
          <dd className="tabular mt-0.5 text-xl font-semibold tracking-tight">{formatNumber(account.followers)}</dd>
          <dd className="tabular text-xs">
            {account.followerChange === null ? (
              <span className="text-muted-foreground">tracking since {account.trackingSince.slice(5).replace("-", "/")}</span>
            ) : (
              <span className={account.followerChange >= 0 ? "text-success" : "text-red-600"}>
                {account.followerChange >= 0 ? "+" : "−"}
                {formatNumber(Math.abs(account.followerChange))} this week
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Readers from {account.networkLabel}</dt>
          <dd className="tabular mt-0.5 text-xl font-semibold tracking-tight">{formatNumber(account.readersThisWeek)}</dd>
          <dd className="text-xs text-muted-foreground">last 7 days</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sent by recent posts</dt>
          <dd className="tabular mt-0.5 text-xl font-semibold tracking-tight">{formatNumber(sent)}</dd>
          <dd className="text-xs text-muted-foreground">
            {linking.length} of {account.recentPosts.length} posts link to you
          </dd>
        </div>
      </dl>

      {account.recentPosts.length > 0 ? (
        <ul className="mt-3">
          {account.recentPosts.slice(0, 5).map((post) => (
            <Post key={post.id} post={post} />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No recent posts.</p>
      )}

      {account.stale && (
        <p className="mt-2 text-xs text-muted-foreground">
          {account.networkLabel} did not respond just now; showing the last saved numbers.
        </p>
      )}
    </article>
  )
}

function ConnectDialog({
  open,
  onOpenChange,
  url,
  onConnected,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  onConnected: () => void
}) {
  const [network, setNetwork] = useState<Network>("bluesky")
  const [handle, setHandle] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network, handle }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Could not connect that account")
        return
      }
      setHandle("")
      onConnected()
    } catch {
      setError("Could not reach the server. Try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Connect a social account</DialogTitle>
            <DialogDescription>
              Housecount reads the account&apos;s public profile and posts. No password or app permission is needed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-5">
            <Segmented
              value={network}
              onChange={setNetwork}
              label="Network"
              options={[
                { value: "bluesky", label: "Bluesky" },
                { value: "mastodon", label: "Mastodon" },
              ]}
            />
            <div className="grid gap-2">
              <Label htmlFor="social-handle">Handle</Label>
              <Input
                id="social-handle"
                value={handle}
                onChange={(event) => setHandle(event.target.value)}
                placeholder={NETWORK_STYLE[network].placeholder}
                autoCapitalize="none"
                spellCheck={false}
                required
                aria-invalid={Boolean(error)}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Looking it up…" : "Connect"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SocialPanel({ url, canEdit }: { url: string; canEdit: boolean }) {
  const [version, setVersion] = useState(0)
  const [connecting, setConnecting] = useState(false)
  const { data: accounts, loading } = usePolling<AccountOverview[]>(`${url}?v=${version}`, socialDelay)

  const disconnect = async (account: AccountOverview) => {
    try {
      const response = await fetch(`${url}/${account.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error()
      setVersion((v) => v + 1)
      toast.success(`${account.handle} disconnected`)
    } catch {
      toast.error("Could not disconnect that account")
    }
  }

  return (
    <>
      <Panel
        title="Social accounts"
        action={
          canEdit && (
            <Button variant="outline" size="sm" className="h-7 bg-transparent px-2.5 text-xs" onClick={() => setConnecting(true)}>
              <Plus className="size-3.5" />
              Connect
            </Button>
          )
        }
      >
        {loading ? (
          <div className="grid gap-3 p-2 lg:grid-cols-2" aria-hidden>
            {[1, 2].map((n) => (
              <div key={n} className="h-64 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : accounts && accounts.length > 0 ? (
          <div className="grid gap-3 p-1 lg:grid-cols-2">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} canEdit={canEdit} onDisconnect={() => disconnect(account)} />
            ))}
          </div>
        ) : (
          <div className="px-2 py-8 text-center">
            <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-muted">
              <Link2 className="size-4 text-muted-foreground" aria-hidden />
            </span>
            <p className="mt-3 text-sm font-medium">See which posts actually send readers</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Connect your Bluesky or Mastodon account to track followers and see, post by post, how many readers each
              link brought to your site.
            </p>
            {canEdit && (
              <Button variant="outline" size="sm" className="mt-4 bg-transparent" onClick={() => setConnecting(true)}>
                <Plus className="size-3.5" />
                Connect an account
              </Button>
            )}
          </div>
        )}
      </Panel>

      {canEdit && (
        <ConnectDialog
          open={connecting}
          onOpenChange={setConnecting}
          url={url}
          onConnected={() => {
            setConnecting(false)
            setVersion((v) => v + 1)
            toast.success("Account connected")
          }}
        />
      )}
    </>
  )
}
