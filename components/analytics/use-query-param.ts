"use client"

import { useCallback, useSyncExternalStore } from "react"

// Keeps a piece of UI state (date range, selected site) in the address bar, so a
// reload or a shared link opens the same view. Updates replace the current
// history entry rather than adding one per click.

const CHANGED = "housecount:query-change"

function subscribe(notify: () => void) {
  window.addEventListener("popstate", notify)
  window.addEventListener(CHANGED, notify)
  return () => {
    window.removeEventListener("popstate", notify)
    window.removeEventListener(CHANGED, notify)
  }
}

// `serverValue` is the parameter as the server saw it, so the first paint
// already shows the requested view instead of the fallback
export function useQueryParam<T extends string>(
  name: string,
  fallback: T,
  allowed?: readonly T[],
  serverValue: string | null = null,
): [T, (next: T) => void] {
  const raw = useSyncExternalStore(
    subscribe,
    () => new URLSearchParams(window.location.search).get(name),
    () => serverValue,
  )
  const value = raw !== null && (!allowed || allowed.includes(raw as T)) ? (raw as T) : fallback

  const setValue = useCallback(
    (next: T) => {
      const url = new URL(window.location.href)
      if (next === fallback) url.searchParams.delete(name)
      else url.searchParams.set(name, next)
      window.history.replaceState(window.history.state, "", url)
      window.dispatchEvent(new Event(CHANGED))
    },
    [name, fallback],
  )

  return [value, setValue]
}
