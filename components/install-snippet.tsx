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
    // The button sits beside the code in its own column, so it can never cover the text
    <div className={cn("flex items-start gap-2 rounded-2xl border border-border bg-muted p-2", className)}>
      <pre className="min-w-0 flex-1 overflow-x-auto px-2 py-1.5 font-mono text-[13px] leading-relaxed text-foreground/90">
        <code>{code}</code>
      </pre>
      <button
        type="button"
        onClick={copy}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-ring"
      >
        {copied ? <Check className="size-3.5 text-brand" /> : <Copy className="size-3.5" />}
        <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
      </button>
    </div>
  )
}
