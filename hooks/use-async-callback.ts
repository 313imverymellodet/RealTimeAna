import { useCallback, useState } from "react"

interface UseAsyncCallbackOptions {
  onSuccess?: (data?: any) => void
  onError?: (error: Error) => void
}

export function useAsyncCallback(
  callback: () => Promise<void>,
  options?: UseAsyncCallbackOptions,
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true)
    setError(null)

    try {
      await callback()
      options?.onSuccess?.()
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error")
      setError(error)
      options?.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [callback, options])

  return { execute, loading, error }
}
