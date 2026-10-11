const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 })

export function formatNumber(value: number) {
  return value >= 10_000 ? compact.format(value) : value.toLocaleString("en")
}

export function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ${String(seconds % 60).padStart(2, "0")}s`
}

// Percent change from the previous period, or null when there is nothing to compare with
export function percentChange(current: number, previous: number) {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 1000) / 10
}

let regionNames: Intl.DisplayNames | undefined

export function countryName(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return code
  try {
    regionNames ??= new Intl.DisplayNames(["en"], { type: "region" })
    return regionNames.of(code) || code
  } catch {
    return code
  }
}

export function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🌐"
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}
