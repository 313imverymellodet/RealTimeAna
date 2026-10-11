"use client"

import createGlobe from "cobe"
import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export interface GlobePoint {
  lat: number
  lng: number
}

// Lightweight WebGL globe. Markers update in place when `points` changes.
export function Globe({ points, className }: { points: GlobePoint[]; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointsRef = useRef(points)

  useEffect(() => {
    pointsRef.current = points
  }, [points])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let size = canvas.offsetWidth
    let phi = 4.2
    let drag: { x: number; phi: number } | null = null
    let frame = 0
    let shown: GlobePoint[] | null = null

    const markers = () => pointsRef.current.map((p) => ({ location: [p.lat, p.lng] as [number, number], size: 0.06 }))

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi,
      theta: 0.25,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 16000,
      mapBrightness: 5,
      baseColor: [0.22, 0.24, 0.28],
      markerColor: [0.3, 0.95, 0.6],
      glowColor: [0.1, 0.14, 0.13],
      markers: markers(),
      markerElevation: 0,
    })

    const onResize = () => {
      size = canvas.offsetWidth
    }
    window.addEventListener("resize", onResize)

    const onPointerDown = (e: PointerEvent) => {
      drag = { x: e.clientX, phi }
      canvas.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (drag) phi = drag.phi + (e.clientX - drag.x) / 160
    }
    const onPointerUp = () => {
      drag = null
    }
    canvas.addEventListener("pointerdown", onPointerDown)
    canvas.addEventListener("pointermove", onPointerMove)
    canvas.addEventListener("pointerup", onPointerUp)
    canvas.addEventListener("pointercancel", onPointerUp)

    const render = () => {
      if (!drag && !reduceMotion) phi += 0.0025
      const next: Parameters<typeof globe.update>[0] = { phi, width: size * dpr, height: size * dpr }
      if (shown !== pointsRef.current) {
        shown = pointsRef.current
        next.markers = markers()
      }
      globe.update(next)
      frame = requestAnimationFrame(render)
    }
    frame = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("resize", onResize)
      canvas.removeEventListener("pointerdown", onPointerDown)
      canvas.removeEventListener("pointermove", onPointerMove)
      canvas.removeEventListener("pointerup", onPointerUp)
      canvas.removeEventListener("pointercancel", onPointerUp)
      globe.destroy()
    }
  }, [])

  return (
    <div className={cn("relative aspect-square w-full", className)}>
      <canvas
        ref={canvasRef}
        className="size-full cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label="Globe showing where current visitors are located"
      />
    </div>
  )
}
