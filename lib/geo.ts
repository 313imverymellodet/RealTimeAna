import "server-only"
import geoip from "geoip-lite"

export interface Geo {
  country: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

const EMPTY: Geo = { country: null, region: null, city: null, latitude: null, longitude: null }

// Coordinates are rounded to one decimal (roughly 11 km) before they are stored
function coarse(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value * 10) / 10 : null
}

function decode(value: string | null) {
  if (!value) return null
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

// Prefers geo headers set by the hosting edge (Vercel, Cloudflare), then falls
// back to the bundled GeoLite database. The IP address itself is never stored.
export function lookupGeo(headers: Headers, ip: string | null): Geo {
  const vercelCountry = headers.get("x-vercel-ip-country")
  if (vercelCountry) {
    return {
      country: vercelCountry.toUpperCase(),
      region: headers.get("x-vercel-ip-country-region"),
      city: decode(headers.get("x-vercel-ip-city")),
      latitude: coarse(Number.parseFloat(headers.get("x-vercel-ip-latitude") || "")),
      longitude: coarse(Number.parseFloat(headers.get("x-vercel-ip-longitude") || "")),
    }
  }

  if (ip) {
    const hit = geoip.lookup(ip)
    if (hit) {
      return {
        country: hit.country || null,
        region: hit.region || null,
        city: hit.city || null,
        latitude: coarse(hit.ll?.[0]),
        longitude: coarse(hit.ll?.[1]),
      }
    }
  }

  const cfCountry = headers.get("cf-ipcountry")
  if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
    return { ...EMPTY, country: cfCountry.toUpperCase() }
  }

  return EMPTY
}

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || headers.get("x-real-ip") || headers.get("cf-connecting-ip") || null
}
