import "server-only"
import { asc, eq, sql, type SQL } from "drizzle-orm"
import { getDb, schema } from "@/lib/db"
import type { FunnelStep } from "@/lib/db/schema"
import { rangeStart, rows, type RangeKey } from "@/lib/stats"

export const MAX_FUNNELS_PER_SITE = 5
export const MAX_FUNNEL_STEPS = 6

export interface FunnelResult {
  id: string
  name: string
  steps: (FunnelStep & { visitors: number })[]
}

// Returns clean steps, or null when the input is not a usable funnel
export function parseSteps(input: unknown): FunnelStep[] | null {
  if (!Array.isArray(input) || input.length < 2 || input.length > MAX_FUNNEL_STEPS) return null

  const steps: FunnelStep[] = []
  for (const raw of input) {
    const type = raw?.type
    const value = typeof raw?.value === "string" ? raw.value.trim() : ""
    if (type === "page") {
      if (!value.startsWith("/") || value.length > 500) return null
      steps.push({ type, value })
    } else if (type === "goal") {
      if (!/^[a-z0-9][a-z0-9_ -]{0,63}$/i.test(value)) return null
      steps.push({ type, value: value.toLowerCase() })
    } else {
      return null
    }
  }
  return steps
}

function matches(step: FunnelStep): SQL {
  if (step.type === "goal") {
    return sql`kind = 'goal' and value = ${step.value}`
  }
  if (step.value.endsWith("*")) {
    // Escape LIKE wildcards in the user's text, then match it as a prefix
    const prefix = step.value.slice(0, -1).replace(/[\\%_]/g, (c) => `\\${c}`)
    return sql`kind = 'page' and value like ${`${prefix}%`}`
  }
  return sql`kind = 'page' and value = ${step.value}`
}

// Counts visitors who completed each step in order. Step N only counts when it
// happens at or after the moment the same visitor completed step N-1.
async function countSteps(siteId: string, from: SQL, steps: FunnelStep[]): Promise<number[]> {
  const stages: SQL[] = steps.map((step, index) =>
    index === 0
      ? sql`s0 as (select visitor_id, min(at) as at from acts where ${matches(step)} group by visitor_id)`
      : sql`${sql.raw(`s${index}`)} as (
          select acts.visitor_id, min(acts.at) as at
          from acts
          join ${sql.raw(`s${index - 1}`)} prev on prev.visitor_id = acts.visitor_id and acts.at >= prev.at
          where ${matches(step)}
          group by acts.visitor_id
        )`,
  )

  const counts = steps.map((_, index) => sql`(select count(*) from ${sql.raw(`s${index}`)}) as ${sql.raw(`c${index}`)}`)

  const [row] = await rows<Record<string, string>>(sql`
    with acts as (
      -- An identified user keeps one id across days and devices; everyone else is a daily visitor hash
      select coalesce(i.user_id, p.visitor_id) as visitor_id, p.created_at as at, 'page' as kind, p.path as value
      from page_views p
      left join identities i on i.site_id = p.site_id and i.visitor_id = p.visitor_id
      where p.site_id = ${siteId} and p.created_at >= ${from}
      union all
      select coalesce(i.user_id, e.visitor_id) as visitor_id, e.created_at as at, 'goal' as kind, e.name as value
      from events e
      left join identities i on i.site_id = e.site_id and i.visitor_id = e.visitor_id
      where e.site_id = ${siteId} and e.created_at >= ${from}
    ),
    ${sql.join(stages, sql`, `)}
    select ${sql.join(counts, sql`, `)}
  `)

  return steps.map((_, index) => Number(row[`c${index}`]))
}

export async function listFunnels(siteId: string) {
  return getDb().select().from(schema.funnels).where(eq(schema.funnels.siteId, siteId)).orderBy(asc(schema.funnels.createdAt))
}

export async function getFunnelResults(siteId: string, range: RangeKey, timeZone: string): Promise<FunnelResult[]> {
  const funnels = await listFunnels(siteId)
  const from = rangeStart(range, timeZone)

  return Promise.all(
    funnels.map(async (funnel) => {
      const counts = await countSteps(siteId, from, funnel.steps)
      return {
        id: funnel.id,
        name: funnel.name,
        steps: funnel.steps.map((step, index) => ({ ...step, visitors: counts[index] })),
      }
    }),
  )
}
