"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, ChevronRight } from "lucide-react"

const visitors = [
  { lat: 51.5, lng: -0.12, color: "#3b82f6" },
  { lat: 48.85, lng: 2.35, color: "#f97316" },
  { lat: 52.52, lng: 13.4, color: "#8b5cf6" },
  { lat: 40.71, lng: -74.0, color: "#ef4444" },
  { lat: 35.68, lng: 139.69, color: "#10b981" },
  { lat: 55.75, lng: 37.61, color: "#f59e0b" },
  { lat: 30.04, lng: 31.23, color: "#ec4899" },
  { lat: 28.61, lng: 77.2, color: "#06b6d4" },
  { lat: 1.35, lng: 103.82, color: "#84cc16" },
  { lat: -33.87, lng: 151.21, color: "#a855f7" },
]

export function GlobeSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((r) => r + 0.2)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 20

    ctx.clearRect(0, 0, width, height)

    // Draw globe background
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
    gradient.addColorStop(0, "rgba(148, 163, 184, 0.1)")
    gradient.addColorStop(1, "rgba(148, 163, 184, 0.05)")

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw grid lines
    ctx.strokeStyle = "rgba(148, 163, 184, 0.2)"
    ctx.lineWidth = 1

    // Latitude lines
    for (let i = -60; i <= 60; i += 30) {
      const y = centerY - (i / 90) * radius
      const xOffset = Math.sqrt(radius * radius - (y - centerY) * (y - centerY))
      ctx.beginPath()
      ctx.ellipse(centerX, y, xOffset, xOffset * 0.3, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Longitude lines
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 + rotation) * (Math.PI / 180)
      ctx.beginPath()
      ctx.ellipse(centerX, centerY, radius * Math.abs(Math.cos(angle)), radius, 0, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Draw visitors as dots
    visitors.forEach((visitor, index) => {
      const adjustedLng = visitor.lng + rotation
      const x =
        centerX + radius * 0.8 * Math.cos((adjustedLng * Math.PI) / 180) * Math.cos((visitor.lat * Math.PI) / 180)
      const y = centerY - radius * 0.8 * Math.sin((visitor.lat * Math.PI) / 180)

      // Only show if on visible side
      const visibleSide = Math.cos((adjustedLng * Math.PI) / 180) > -0.2

      if (visibleSide) {
        // Glow effect
        const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, 12)
        glowGradient.addColorStop(0, visitor.color + "80")
        glowGradient.addColorStop(1, visitor.color + "00")
        ctx.beginPath()
        ctx.arc(x, y, 12, 0, Math.PI * 2)
        ctx.fillStyle = glowGradient
        ctx.fill()

        // Dot
        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = visitor.color
        ctx.fill()

        // White center
        ctx.beginPath()
        ctx.arc(x, y, 2, 0, Math.PI * 2)
        ctx.fillStyle = "#ffffff"
        ctx.fill()
      }
    })
  }, [rotation])

  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
            Realtime
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-violet-600">
            Experience your live visitors like never before
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Watch and visualise how visitors arrive and interact with your website on an interactive globe.
          </p>
        </div>

        <div className="relative">
          <canvas ref={canvasRef} width={600} height={600} className="mx-auto max-w-full" />

          <Card className="absolute bottom-8 left-1/2 -translate-x-1/2 shadow-lg border min-w-[280px]">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pages</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">/pricing</span>
                    <span className="text-muted-foreground">8</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Referrers</span>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Direct</span>
                    <span className="text-muted-foreground">22</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Countries</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🇺🇸</span>
                    <span className="font-medium">United States</span>
                    <span className="text-muted-foreground">16</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 max-w-2xl mx-auto text-center">
          <p className="text-4xl font-bold text-violet-500 mb-6">49</p>
          <p className="text-muted-foreground leading-relaxed">
            Most founders check their analytics once a week, if that. Numbers in a table don't exactly spark joy. But
            watching a real person in Berlin land on your site right now? Seeing that customer from Tokyo come back for
            the third time this week? That's genuinely exciting.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">
            You start spotting patterns. Which blog posts bring people back. Which regions love your product. When your
            best users show up. You catch problems faster and actually feel your growth happening.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
            Launch a campaign and watch visitors arrive in seconds, not hours.
          </p>
        </div>
      </div>
    </section>
  )
}
