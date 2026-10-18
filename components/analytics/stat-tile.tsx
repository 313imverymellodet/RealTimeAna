import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function StatTile({
  label,
  value,
  change,
  // For bounce rate a drop is the good direction
  invert = false,
  loading,
  selected,
  onSelect,
}: {
  label: string
  value: string
  change: number | null
  invert?: boolean
  loading: boolean
  selected?: boolean
  onSelect?: () => void
}) {
  const good = change !== null && (invert ? change < 0 : change > 0)
  const content = (
    <>
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {onSelect && <span className={cn("size-1.5 rounded-full", selected ? "bg-brand" : "bg-border")} />}
        {label}
      </span>
      <span className="tabular mt-2 block text-2xl font-semibold tracking-tight">
        {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted/60 align-middle" /> : value}
      </span>
      <span
        className={cn(
          "tabular mt-1 flex h-4 items-center gap-0.5 text-xs font-medium",
          change === null || change === 0 ? "text-muted-foreground" : good ? "text-success" : "text-red-600",
        )}
      >
        {!loading && change !== null && change !== 0 && (
          <>
            {change > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(change)}%<span className="ml-1 font-normal text-muted-foreground">vs previous</span>
          </>
        )}
      </span>
    </>
  )

  const className = cn(
    "rounded-2xl border bg-card p-4 text-left transition-colors",
    selected ? "border-brand/50" : "border-border",
  )

  return onSelect ? (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={cn(className, "hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-ring")}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  )
}
