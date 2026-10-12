"use client"

import { Loader2 } from "lucide-react"
import { CodeBlock, buildSnippet, useOrigin } from "@/components/install-snippet"

// Shown until the first page view arrives. The parent dashboard keeps polling,
// so this panel is replaced by live charts the moment tracking works.
export function InstallPanel({ siteId, domain }: { siteId: string; domain: string }) {
  const origin = useOrigin()

  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-border bg-card shadow-[0_1px_3px_rgb(0_0_0/0.04)] p-6 sm:p-8">
      <p className="text-xs font-medium tracking-wide text-brand-ink uppercase">One step left</p>
      <h2 className="mt-2 text-2xl font-semibold tracking-tight">Add the script to {domain}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Paste this into the <code className="font-mono text-foreground">&lt;head&gt;</code> of every page, then open your
        site in a new tab. This screen switches to your dashboard as soon as the first visit arrives.
      </p>

      <CodeBlock code={buildSnippet(origin, siteId)} className="mt-5" />

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm">
        <Loader2 className="size-4 shrink-0 animate-spin text-brand-ink" aria-hidden />
        <span role="status">Waiting for the first page view from {domain}…</span>
      </div>

      <ul className="mt-5 space-y-1.5 text-sm text-muted-foreground">
        <li>Visits from localhost are ignored, so test on the live domain.</li>
        <li>Browsers with Do Not Track or Global Privacy Control turned on are not counted.</li>
        <li>Using a framework? See the install guides in the docs.</li>
      </ul>
    </section>
  )
}
