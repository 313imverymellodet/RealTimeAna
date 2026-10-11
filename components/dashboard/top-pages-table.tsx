"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface TopPagesTableProps {
  siteId: string
  timeRange: string
}

interface PageData {
  path: string
  views: number
  visitors: number
  avgDuration: number
}

export function TopPagesTable({ siteId, timeRange }: TopPagesTableProps) {
  const [pages, setPages] = useState<PageData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const supabase = createClient()

      const now = new Date()
      let startDate: Date
      switch (timeRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      }

      const { data: pageViews } = await supabase
        .from("page_views")
        .select("path, visitor_id, duration")
        .eq("site_id", siteId)
        .gte("created_at", startDate.toISOString())

      if (!pageViews || pageViews.length === 0) {
        setPages([])
        setIsLoading(false)
        return
      }

      // Group by path
      const grouped = new Map<string, { visitors: Set<string>; views: number; durations: number[] }>()

      pageViews.forEach((pv) => {
        if (!grouped.has(pv.path)) {
          grouped.set(pv.path, { visitors: new Set(), views: 0, durations: [] })
        }
        const entry = grouped.get(pv.path)!
        entry.visitors.add(pv.visitor_id)
        entry.views++
        if (pv.duration) entry.durations.push(pv.duration)
      })

      const pageData: PageData[] = Array.from(grouped.entries())
        .map(([path, stats]) => ({
          path,
          views: stats.views,
          visitors: stats.visitors.size,
          avgDuration:
            stats.durations.length > 0
              ? Math.round(stats.durations.reduce((a, b) => a + b, 0) / stats.durations.length)
              : 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10)

      setPages(pageData)
      setIsLoading(false)
    }

    fetchData()
  }, [siteId, timeRange])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="font-medium">Loading pages...</span>
        </div>
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">No page data available for this time period.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Top Pages</h3>
      <Table>
        <TableHeader>
          <TableRow className="border-b">
            <TableHead className="font-medium">Page</TableHead>
            <TableHead className="text-right font-medium">Views</TableHead>
            <TableHead className="text-right font-medium">Visitors</TableHead>
            <TableHead className="text-right font-medium">Avg. Duration</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page.path} className="hover:bg-muted/50 transition-colors">
              <TableCell className="font-mono text-sm">{page.path}</TableCell>
              <TableCell className="text-right tabular-nums">{page.views.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums">{page.visitors.toLocaleString()}</TableCell>
              <TableCell className="text-right tabular-nums text-muted-foreground">
                {formatDuration(page.avgDuration)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
