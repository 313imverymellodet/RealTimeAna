"use client"

import { Check, Copy } from "lucide-react"
import { useState, useSyncExternalStore } from "react"
import { cn } from "@/lib/utils"

const subscribe = () => () => {}

// The app's own origin; empty during server rendering
export function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  )
}

export function buildSnippet(origin: string, siteId: string) {
  return `<script defer data-site-id="${siteId}" src="${origin}/tracker.js"></script>`
}

export function CodeBlock({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access denied; the code stays selectable
    }
  }

  return (
    <div className={cn("group relative rounded-2xl border border-border bg-muted", className)}>
      <pre className="overflow-x-auto p-4 pr-24 font-mono text-[13px] leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
      >
        {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  )
}
