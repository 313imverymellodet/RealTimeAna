"use client"

import { useEffect, useRef, useState } from "react"

// Polls a JSON endpoint. Keeps the last good value on screen while refreshing.
// `nextDelay` picks the wait before the next request from the latest data.
export function usePolling<T>(url: string, nextDelay: (data: T | null) => number) {
  const [state, setState] = useState<{ url: string; data: T | null; failed: boolean }>({
    url,
    data: null,
    failed: false,
  })
  const delayRef = useRef(nextDelay)

  useEffect(() => {
    delayRef.current = nextDelay
  }, [nextDelay])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    let loaded = false

    const load = async () => {
      let data: T | null = null
      // Always make the first request; after that, skip refreshes while the tab is in the background
      if (!loaded || document.visibilityState === "visible") {
        try {
          const response = await fetch(url, { cache: "no-store" })
          if (!response.ok) throw new Error(String(response.status))
          data = (await response.json()) as T
          loaded = true
          if (!cancelled) setState({ url, data, failed: false })
        } catch {
          if (!cancelled) setState((prev) => ({ url, data: prev.url === url ? prev.data : null, failed: true }))
        }
      }
      if (!cancelled) timer = setTimeout(load, delayRef.current(data))
    }

    load()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [url])

  // Data fetched for a different URL (e.g. the previous range) is stale
  const current = state.url === url ? state : { data: null, failed: false }
  return { data: current.data, failed: current.failed, loading: current.data === null && !current.failed }
}
