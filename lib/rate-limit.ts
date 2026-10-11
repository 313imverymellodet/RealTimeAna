// Best-effort fixed-window rate limiter held in process memory.
// On serverless each warm instance keeps its own counters, so this slows a
// flood from one client but is not a hard guarantee. Swap for a shared store
// (e.g. Upstash Redis) or a platform firewall rule before relying on it.

const WINDOW_MS = 60_000
const MAX_KEYS = 10_000

const hits = new Map<string, { count: number; resetAt: number }>()

export function isRateLimited(key: string, limit: number): boolean {
  const now = Date.now()
  const entry = hits.get(key)

  if (!entry || entry.resetAt <= now) {
    if (hits.size >= MAX_KEYS) {
      for (const [k, v] of hits) {
        if (v.resetAt <= now) hits.delete(k)
      }
      if (hits.size >= MAX_KEYS) hits.clear()
    }
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > limit
}
