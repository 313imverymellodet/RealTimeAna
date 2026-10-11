"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ChevronRight, ArrowRight } from "lucide-react"

interface Visitor {
  id: string
  latitude: number
  longitude: number
  country: string
  city: string
  path: string
  referrer: string
  color: string
}

interface RealtimeGlobeProps {
  siteId: string
}

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
  China: "🇨🇳",
  Mexico: "🇲🇽",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  Netherlands: "🇳🇱",
  Sweden: "🇸🇪",
  Singapore: "🇸🇬",
  "South Korea": "🇰🇷",
  UAE: "🇦🇪",
}

const markerColors = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#22c55e", "#14b8a6"]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

function mode(arr: string[]): string {
  const counts = new Map<string, number>()
  arr.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1))
  let maxCount = 0
  let maxItem = ""
  counts.forEach((count, item) => {
    if (count > maxCount) {
      maxCount = count
      maxItem = item
    }
  })
  return maxItem
}

export function RealtimeGlobe({ siteId }: RealtimeGlobeProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const [visitors, setVisitors] = useState<Visitor[]>([])
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [mapboxToken, setMapboxToken] = useState<string | null>(null)
  const [stats, setStats] = useState({
    liveVisitors: 0,
    topCountry: "",
    topPage: "",
    topReferrer: "",
    pageCount: 0,
    referrerCount: 0,
    countryCount: 0,
  })

  // Fetch Mapbox token from API
  useEffect(() => {
    fetch("/api/config/mapbox")
      .then((res) => res.json())
      .then((data) => setMapboxToken(data.token))
      .catch(() => setMapError("Failed to load map configuration"))
  }, [])

  // Fetch recent visitors with location data
  useEffect(() => {
    const fetchVisitors = async () => {
      const supabase = createClient()
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      const { data } = await supabase
        .from("page_views")
        .select("id, latitude, longitude, country, city, path, referrer, created_at")
        .eq("site_id", siteId)
        .gte("created_at", fiveMinutesAgo)
        .not("latitude", "is", null)
        .order("created_at", { ascending: false })
        .limit(100)

      if (data) {
        const mappedVisitors = data.map((v) => ({
          id: v.id,
          latitude: v.latitude,
          longitude: v.longitude,
          country: v.country || "Unknown",
          city: v.city || "Unknown",
          path: v.path,
          referrer: v.referrer || "Direct",
          color: markerColors[hashString(v.country || "Unknown") % markerColors.length],
        }))
        setVisitors(mappedVisitors)

        const countries = data.map((v) => v.country).filter(Boolean)
        const pages = data.map((v) => v.path)
        const referrers = data.map((v) => v.referrer || "Direct")

        setStats({
          liveVisitors: new Set(data.map((v) => v.id)).size,
          topCountry: countries.length > 0 ? mode(countries) : "N/A",
          topPage: pages.length > 0 ? mode(pages) : "N/A",
          topReferrer: referrers.length > 0 ? mode(referrers) : "Direct",
          pageCount: new Set(pages).size,
          referrerCount: new Set(referrers).size,
          countryCount: new Set(countries).size,
        })
      }
    }

    fetchVisitors()
    const interval = setInterval(fetchVisitors, 10000)
    return () => clearInterval(interval)
  }, [siteId])

  // Initialize Mapbox
  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current || mapRef.current) return

    // Load Mapbox CSS
    const link = document.createElement("link")
    link.href = "https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    // Load Mapbox JS via script tag
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
          console.error("Mapbox error:", e)
          setMapError("Failed to load map")
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

      <div className="rounded-xl overflow-hidden border border-border bg-zinc-950">
        <div ref={mapContainerRef} className="w-full h-[450px]" style={{ background: "#09090b" }} />

        {mapError && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90">
            <p className="text-zinc-500">{mapError}</p>
          </div>
        )}

        {/* Live indicator */}
        {stats.liveVisitors > 0 && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-zinc-950/90 backdrop-blur border border-zinc-800 rounded-full px-3 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-white">{stats.liveVisitors} active</span>
          </div>
        )}

        {/* Stats panel */}
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-zinc-950/95 backdrop-blur border border-zinc-800 rounded-xl p-1">
          <div className="flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800/50 rounded-lg cursor-pointer">
            <span className="text-sm text-zinc-500">Pages</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-white truncate max-w-[100px]">
                {stats.topPage || "/"}
              </span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{stats.pageCount}</span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </div>

          <div className="h-px bg-zinc-800 mx-2" />

          <div className="flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800/50 rounded-lg cursor-pointer">
            <span className="text-sm text-zinc-500">Referrers</span>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-zinc-500" />
              <span className="text-sm font-medium text-white truncate max-w-[80px]">{stats.topReferrer}</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{stats.referrerCount}</span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </div>

          <div className="h-px bg-zinc-800 mx-2" />

          <div className="flex items-center justify-between px-3 py-2.5 hover:bg-zinc-800/50 rounded-lg cursor-pointer">
            <span className="text-sm text-zinc-500">Countries</span>
            <div className="flex items-center gap-2">
              <span>{countryFlags[stats.topCountry] || "🌍"}</span>
              <span className="text-sm font-medium text-white">{stats.topCountry || "N/A"}</span>
              <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{stats.countryCount}</span>
              <ChevronRight className="h-4 w-4 text-zinc-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
