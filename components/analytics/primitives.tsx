import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Panel({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card/60", className)}>
      <header className="flex h-12 items-center justify-between gap-3 border-b border-border/70 px-4">
        <h2 className="text-sm font-medium">{title}</h2>
        {action}
      </header>
      <div className="p-2">{children}</div>
    </section>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-lg border border-border bg-background p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
            value === option.value && "bg-secondary text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
