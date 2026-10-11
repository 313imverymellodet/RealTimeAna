"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Button } from "@/components/ui/button"
import { Code, ArrowRight } from "lucide-react"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface MetricsChartProps {
  siteId: string
  timeRange: string
}

interface ChartData {
  date: string
  visitors: number
  pageViews: number
}

export function MetricsChart({ siteId, timeRange }: MetricsChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const supabase = createClient()

      const now = new Date()
      let startDate: Date
      let groupByHour = false

      switch (timeRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          groupByHour = true
          break
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          groupByHour = true
      }

      const { data: pageViews } = await supabase
        .from("page_views")
        .select("created_at, visitor_id")
        .eq("site_id", siteId)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true })

      if (!pageViews || pageViews.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }

      const grouped = new Map<string, { visitors: Set<string>; pageViews: number }>()

      pageViews.forEach((pv) => {
        const date = new Date(pv.created_at)
        const key = groupByHour
          ? `${date.getHours().toString().padStart(2, "0")}:00`
          : date.toLocaleDateString("en-US", { month: "short", day: "numeric" })

        if (!grouped.has(key)) {
          grouped.set(key, { visitors: new Set(), pageViews: 0 })
        }
        const entry = grouped.get(key)!
        entry.visitors.add(pv.visitor_id)
        entry.pageViews++
      })

      const chartData: ChartData[] = Array.from(grouped.entries()).map(([date, stats]) => ({
        date,
        visitors: stats.visitors.size,
        pageViews: stats.pageViews,
      }))

      setData(chartData)
      setIsLoading(false)
    }

    fetchData()
  }, [siteId, timeRange])

  if (isLoading) {
    return (
      <>
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold">Visitors Over Time</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[350px] flex items-center justify-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <div className="h-10 w-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground font-medium">Loading analytics...</span>
            </div>
          </div>
        </CardContent>
      </>
    )
  }

  if (data.length === 0) {
    return (
      <>
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold">Visitors Over Time</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-[350px] flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mx-auto w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-4 ring-1 ring-border">
                <Code className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No data yet</h3>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Install the tracking script on your website to start collecting visitor analytics in real-time.
              </p>
              <Button variant="outline" className="shadow-sm bg-transparent" asChild>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    const setupTab = document.querySelector('[value="setup"]') as HTMLButtonElement
                    setupTab?.click()
                  }}
                >
                  View setup instructions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </>
    )
  }

  return (
    <>
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold">Visitors Over Time</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="visitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(272, 56%, 55%)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="hsl(272, 56%, 55%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.5} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                padding: "12px",
              }}
              labelStyle={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}
              itemStyle={{ fontSize: 13 }}
            />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="hsl(272, 56%, 55%)"
              fillOpacity={1}
              fill="url(#visitors)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 3, stroke: "hsl(var(--background))", fill: "hsl(272, 56%, 55%)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  )
}
