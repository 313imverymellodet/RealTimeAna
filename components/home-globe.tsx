"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronRight, ArrowRight } from "lucide-react"

interface DemoVisitor {
  id: string
  latitude: number
  longitude: number
  country: string
  city: string
  path: string
  referrer: string
  color: string
}

const demoLocations = [
  { city: "New York", country: "United States", lat: 40.7128, lng: -74.006 },
  { city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  { city: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { city: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
  { city: "Dubai", country: "UAE", lat: 25.2048, lng: 55.2708 },
  { city: "Mumbai", country: "India", lat: 19.076, lng: 72.8777 },
  { city: "Seoul", country: "South Korea", lat: 37.5665, lng: 126.978 },
]

const demoPaths = ["/", "/pricing", "/features", "/docs", "/blog", "/about"]
const demoReferrers = ["Direct", "google.com", "twitter.com", "github.com", "producthunt.com"]
const markerColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#14b8a6"]

const countryFlags: Record<string, string> = {
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Germany: "🇩🇪",
  France: "🇫🇷",
  Canada: "🇨🇦",
  Australia: "🇦🇺",
  Japan: "🇯🇵",
  Brazil: "🇧🇷",
  India: "🇮🇳",
  Singapore: "🇸🇬",
  "South Korea": "🇰🇷",
  UAE: "🇦🇪",
}

export function HomeGlobe() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [visitors, setVisitors] = useState<DemoVisitor[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapboxToken, setMapboxToken] = useState<string | null>(null)

  // Fetch Mapbox token from API
  useEffect(() => {
    fetch("/api/config/mapbox")
      .then((res) => res.json())
      .then((data) => setMapboxToken(data.token))
      .catch(() => setMapError("Failed to load map configuration"))
  }, [])

  // Generate demo visitors
  useEffect(() => {
    const generateVisitors = () => {
      const count = 5 + Math.floor(Math.random() * 8)
      const newVisitors: DemoVisitor[] = []

      for (let i = 0; i < count; i++) {
        const loc = demoLocations[Math.floor(Math.random() * demoLocations.length)]
        newVisitors.push({
          id: `visitor-${Date.now()}-${i}`,
          latitude: loc.lat + (Math.random() - 0.5) * 2,
          longitude: loc.lng + (Math.random() - 0.5) * 2,
          country: loc.country,
          city: loc.city,
          path: demoPaths[Math.floor(Math.random() * demoPaths.length)],
          referrer: demoReferrers[Math.floor(Math.random() * demoReferrers.length)],
          color: markerColors[Math.floor(Math.random() * markerColors.length)],
        })
      }
      setVisitors(newVisitors)
    }

    generateVisitors()
    const interval = setInterval(generateVisitors, 5000)
    return () => clearInterval(interval)
  }, [])

  // Initialize Mapbox
  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return

    // Load Mapbox CSS
    const link = document.createElement("link")
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.js"
    script.async = true
    script.onload = () => {
      try {
        const mapboxgl = (window as any).mapboxgl
        if (!mapboxgl) {
          setMapError("Mapbox failed to load")
          return
        }

        mapboxgl.accessToken = mapboxToken

        const map = new mapboxgl.Map({
          container: mapContainerRef.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [0, 20],
          zoom: 1.5,
          projection: "globe",
          attributionControl: false,
        })

        map.on("style.load", () => {
          map.setFog({
            color: "rgb(10, 10, 20)",
            "high-color": "rgb(30, 40, 80)",
            "horizon-blend": 0.1,
            "space-color": "rgb(5, 5, 15)",
            "star-intensity": 0.5,
          })
          setMapLoaded(true)
        })

        map.on("error", (e: any) => {
          const errorMessage = e?.error?.message || e?.message || "Unknown map error"
          console.log("[v0] Mapbox error details:", JSON.stringify(e, null, 2))
          console.log("[v0] Error message:", errorMessage)
          // Only set error state for critical errors, not tile loading issues
          if (errorMessage.includes("access token") || errorMessage.includes("unauthorized")) {
            setMapError("Invalid Mapbox token")
          }
        })

        map.on("load", () => {
          console.log("[v0] Mapbox map loaded successfully")
        })

        // Auto-rotate
        const spinGlobe = () => {
          if (!map.isMoving()) {
            const center = map.getCenter()
            center.lng += 0.5
            map.easeTo({ center, duration: 1000, easing: (t: number) => t })
          }
        }
        const spinInterval = setInterval(spinGlobe, 1000)

        mapRef.current = { map, spinInterval }
      } catch (err) {
        console.error("Failed to initialize Mapbox:", err)
        setMapError("Failed to initialize map")
      }
    }
    script.onerror = () => {
      setMapError("Failed to load map library")
    }
    document.head.appendChild(script)

    return () => {
      if (mapRef.current) {
        clearInterval(mapRef.current.spinInterval)
        mapRef.current.map.remove()
        mapRef.current = null
      }
    }
  }, [mapboxToken])

  // Update markers when visitors change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const mapboxgl = (window as any).mapboxgl
    if (!mapboxgl) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    // Add new markers
    visitors.forEach((visitor) => {
      const el = document.createElement("div")
      el.className = "mapbox-visitor-marker"
      el.innerHTML = `
        <div class="marker-pulse" style="background: ${visitor.color}40;"></div>
        <div class="marker-dot" style="background: ${visitor.color};"></div>
        <div class="marker-center"></div>
      `

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([visitor.longitude, visitor.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
            <div style="padding: 8px; font-family: system-ui;">
              <div style="font-weight: 600;">${visitor.city}, ${visitor.country}</div>
              <div style="color: #888; font-size: 12px; margin-top: 4px;">${visitor.path}</div>
              <div style="color: #666; font-size: 11px;">${visitor.referrer}</div>
            </div>
          `),
        )
        .addTo(mapRef.current.map)

      markersRef.current.push(marker)
    })
  }, [visitors, mapLoaded])

  const topCountry =
    visitors.length > 0
      ? visitors.reduce(
          (acc, v) => {
            acc[v.country] = (acc[v.country] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )
      : {}
  const topCountryName = Object.entries(topCountry).sort((a, b) => b[1] - a[1])[0]?.[0] || "United States"
  const topPage = visitors.length > 0 ? visitors[0].path : "/pricing"
  const topReferrer = visitors.length > 0 ? visitors[0].referrer : "Direct"

  return (
    <div className="relative">
      <style jsx global>{`
        .mapbox-visitor-marker {
          position: relative;
          width: 24px;
          height: 24px;
          cursor: pointer;
        }
        .marker-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        }
        .marker-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 12px;
          height: 12px;
          margin: -6px 0 0 -6px;
          border-radius: 50%;
          box-shadow: 0 0 10px currentColor;
        }
        .marker-center {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 4px;
          height: 4px;
          margin: -2px 0 0 -2px;
          background: white;
          border-radius: 50%;
        }
        @keyframes pulse {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        .mapboxgl-popup-content {
          background: #18181b !important;
          color: white !important;
          border-radius: 8px !important;
          border: 1px solid #27272a !important;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5) !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: #18181b !important;
        }
      `}</style>

      <div className="rounded-2xl overflow-hidden border border-border bg-zinc-950 shadow-2xl shadow-black/40">
        <div ref={mapContainerRef} className="w-full h-[500px]" style={{ background: "#09090b" }} />

        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90">
            <p className="text-zinc-500">{mapError}</p>
          </div>
        )}

        {/* Live badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-full px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-sm font-medium text-white">{visitors.length} visitors</span>
        </div>

        {/* Stats panel */}
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-xl p-1">
          <div className="flex items-center justify-between px-3 py-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer">
            <span className="text-sm text-zinc-500">Pages</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-white">{topPage}</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">8</span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </div>

          <div className="h-px bg-zinc-800 mx-2" />

          <div className="flex items-center justify-between px-3 py-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer">
            <span className="text-sm text-zinc-500">Referrers</span>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-zinc-500" />
              <span className="text-sm font-medium text-white">{topReferrer}</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">22</span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </div>

          <div className="h-px bg-zinc-800 mx-2" />

          <div className="flex items-center justify-between px-3 py-2 hover:bg-zinc-800/50 rounded-lg cursor-pointer">
            <span className="text-sm text-zinc-500">Countries</span>
            <div className="flex items-center gap-2">
              <span>{countryFlags[topCountryName] || "🌍"}</span>
              <span className="text-sm font-medium text-white">{topCountryName}</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">16</span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
