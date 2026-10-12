"use client"

import { Plus, Target, Trash2, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { FunnelStep } from "@/lib/db/schema"
import { formatNumber } from "@/lib/format"
import type { FunnelResult } from "@/lib/funnels"
import { Panel, Segmented } from "./primitives"
import { usePolling } from "./use-polling"

const funnelDelay = () => 60_000

const BLANK_STEPS: FunnelStep[] = [
  { type: "page", value: "/" },
  { type: "goal", value: "" },
]

function percent(part: number, whole: number) {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0
}

function FunnelChart({ funnel }: { funnel: FunnelResult }) {
  const first = funnel.steps[0]?.visitors ?? 0
  const last = funnel.steps[funnel.steps.length - 1]?.visitors ?? 0

  return (
    <div className="p-2">
      <p className="mb-3 text-sm text-muted-foreground">
        <span className="tabular font-medium text-foreground">{percent(last, first)}%</span> of visitors who started
        finished all {funnel.steps.length} steps.
      </p>
      <ol className="space-y-2">
        {funnel.steps.map((step, index) => {
          const previous = index === 0 ? step.visitors : funnel.steps[index - 1].visitors
          const dropped = previous - step.visitors
          return (
            <li key={`${step.type}-${step.value}-${index}`}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="tabular font-mono text-xs text-muted-foreground">{index + 1}</span>
                  {step.type === "goal" ? (
                    <span className="flex min-w-0 items-center gap-1.5 font-medium">
                      <Target className="size-3.5 shrink-0 text-revenue" aria-hidden />
                      <span className="truncate">{step.value}</span>
                    </span>
                  ) : (
                    <span className="truncate font-mono text-[13px]">{step.value}</span>
                  )}
                </span>
                <span className="tabular flex shrink-0 items-baseline gap-3 font-mono text-xs">
                  {index > 0 && dropped > 0 && (
                    <span className="text-red-600">
                      −{formatNumber(dropped)} ({percent(dropped, previous)}%)
                    </span>
                  )}
                  <span className="text-foreground">{formatNumber(step.visitors)}</span>
                </span>
              </div>
              <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-secondary" aria-hidden>
                <div
                  className="h-full rounded-full bg-brand"
                  style={{ width: `${Math.max(percent(step.visitors, first), step.visitors > 0 ? 1 : 0)}%` }}
                />
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function NewFunnelDialog({
  open,
  onOpenChange,
  url,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  url: string
  onCreated: () => void
}) {
  const [name, setName] = useState("")
  const [steps, setSteps] = useState<FunnelStep[]>(BLANK_STEPS)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const update = (index: number, patch: Partial<FunnelStep>) =>
    setSteps((all) => all.map((step, i) => (i === index ? { ...step, ...patch } : step)))

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, steps }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Could not save the funnel")
        return
      }
      setName("")
      setSteps(BLANK_STEPS)
      onCreated()
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
            <DialogTitle>New funnel</DialogTitle>
            <DialogDescription>
              List the steps in order. A page ending in * matches everything under it, like /blog/*.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-5">
            <div className="grid gap-2">
              <Label htmlFor="funnel-name">Name</Label>
              <Input
                id="funnel-name"
                placeholder="Homepage to purchase"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={60}
                required
              />
            </div>

            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Steps</legend>
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="tabular w-4 shrink-0 font-mono text-xs text-muted-foreground">{index + 1}</span>
                  <Select value={step.type} onValueChange={(type: FunnelStep["type"]) => update(index, { type })}>
                    <SelectTrigger className="w-24 shrink-0" aria-label={`Step ${index + 1} type`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">Page</SelectItem>
                      <SelectItem value="goal">Goal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    aria-label={`Step ${index + 1} ${step.type === "page" ? "path" : "goal name"}`}
                    placeholder={step.type === "page" ? "/pricing" : "signup"}
                    value={step.value}
                    onChange={(event) => update(index, { value: event.target.value })}
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={steps.length <= 2}
                    onClick={() => setSteps((all) => all.filter((_, i) => i !== index))}
                    aria-label={`Remove step ${index + 1}`}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ))}
              {steps.length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-fit bg-transparent"
                  onClick={() => setSteps((all) => [...all, { type: "page", value: "" }])}
                >
                  <Plus className="size-3.5" />
                  Add step
                </Button>
              )}
            </fieldset>

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
              {saving ? "Saving…" : "Create funnel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FunnelPanel({ url, query, canEdit }: { url: string; query: string; canEdit: boolean }) {
  // Bumping the version re-requests the list after a funnel is created or deleted
  const [version, setVersion] = useState(0)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: funnels, loading } = usePolling<FunnelResult[]>(`${url}${query}&v=${version}`, funnelDelay)

  const selected = funnels?.find((funnel) => funnel.id === selectedId) ?? funnels?.[0] ?? null

  // Nothing to show on a public link when the owner has not defined a funnel
  if (!canEdit && funnels && funnels.length === 0) return null

  const remove = async () => {
    if (!selected) return
    try {
      const response = await fetch(`${url}/${selected.id}`, { method: "DELETE" })
      if (!response.ok) throw new Error()
      setSelectedId(null)
      setVersion((v) => v + 1)
      toast.success("Funnel deleted")
    } catch {
      toast.error("Could not delete the funnel")
    }
  }

  return (
    <>
      <Panel
        title="Funnels"
        action={
          <div className="flex items-center gap-2">
            {funnels && funnels.length > 1 && selected && (
              <Segmented
                value={selected.id}
                onChange={setSelectedId}
                label="Funnel"
                options={funnels.map((funnel) => ({ value: funnel.id, label: funnel.name }))}
              />
            )}
            {canEdit && selected && (
              <Button variant="ghost" size="icon-sm" onClick={remove} aria-label={`Delete funnel ${selected.name}`}>
                <Trash2 className="size-3.5" />
              </Button>
            )}
            {canEdit && (
              <Button variant="outline" size="sm" className="h-7 bg-transparent px-2.5 text-xs" onClick={() => setCreating(true)}>
                <Plus className="size-3.5" />
                New
              </Button>
            )}
          </div>
        }
      >
        {loading ? (
          <div className="space-y-2 p-2" aria-hidden>
            {[100, 60, 30].map((width) => (
              <div key={width} className="h-8 animate-pulse rounded-md bg-muted/60" style={{ width: `${width}%` }} />
            ))}
          </div>
        ) : selected ? (
          <>
            {funnels && funnels.length === 1 && <p className="px-2 pt-1 text-sm font-medium">{selected.name}</p>}
            <FunnelChart funnel={selected} />
          </>
        ) : (
          <div className="px-2 py-8 text-center text-sm text-muted-foreground">
            <p>See where visitors drop off between landing and converting.</p>
            {canEdit && (
              <Button variant="outline" size="sm" className="mt-3 bg-transparent" onClick={() => setCreating(true)}>
                <Plus className="size-3.5" />
                Create your first funnel
              </Button>
            )}
          </div>
        )}
      </Panel>

      {canEdit && (
        <NewFunnelDialog
          open={creating}
          onOpenChange={setCreating}
          url={url}
          onCreated={() => {
            setCreating(false)
            setVersion((v) => v + 1)
            toast.success("Funnel created")
          }}
        />
      )}
    </>
  )
}
