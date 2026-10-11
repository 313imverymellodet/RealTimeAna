"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Eye, Timer, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { MetricsChart } from "./metrics-chart"
import { TopPagesTable } from "./top-pages-table"
import { TrackingScript } from "./tracking-script"
import { RealtimeGlobe } from "./realtime-globe"

interface Site {
  id: string
  name: string
  domain: string
}

interface AnalyticsData {
  visitors: number
  pageViews: number
  bounceRate: number
  avgDuration: number
  visitorsChange: number
  pageViewsChange: number
}

export function AnalyticsView({ site }: { site: Site }) {
  const [timeRange, setTimeRange] = useState("today")
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    visitors: 0,
    pageViews: 0,
    bounceRate: 0,
    avgDuration: 0,
    visitorsChange: 0,
    pageViewsChange: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      const supabase = createClient()

      const now = new Date()
      let startDate: Date
      let prevStartDate: Date
      let prevEndDate: Date

      switch (timeRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          prevEndDate = new Date(startDate.getTime() - 1)
          prevStartDate = new Date(prevEndDate.getFullYear(), prevEndDate.getMonth(), prevEndDate.getDate())
          break
        case "7d":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          prevEndDate = new Date(startDate.getTime() - 1)
          prevStartDate = new Date(prevEndDate.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "30d":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          prevEndDate = new Date(startDate.getTime() - 1)
          prevStartDate = new Date(prevEndDate.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          prevEndDate = new Date(startDate.getTime() - 1)
          prevStartDate = new Date(prevEndDate.getFullYear(), prevEndDate.getMonth(), prevEndDate.getDate())
      }

      const { data: pageViewsData } = await supabase
        .from("page_views")
        .select("*")
        .eq("site_id", site.id)
        .gte("created_at", startDate.toISOString())

      const { data: sessionsData } = await supabase
        .from("sessions")
        .select("*")
        .eq("site_id", site.id)
        .gte("started_at", startDate.toISOString())

      const { data: prevPageViewsData } = await supabase
        .from("page_views")
        .select("visitor_id")
        .eq("site_id", site.id)
        .gte("created_at", prevStartDate.toISOString())
        .lte("created_at", prevEndDate.toISOString())

      const { count } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .eq("site_id", site.id)

      setHasData((count || 0) > 0)

      const pageViews = pageViewsData?.length || 0
      const uniqueVisitors = new Set(pageViewsData?.map((pv) => pv.visitor_id)).size
      const prevUniqueVisitors = new Set(prevPageViewsData?.map((pv) => pv.visitor_id)).size
      const prevPageViews = prevPageViewsData?.length || 0

      const totalSessions = sessionsData?.length || 0
      const bouncedSessions = sessionsData?.filter((s) => s.bounced).length || 0
      const bounceRate = totalSessions > 0 ? (bouncedSessions / totalSessions) * 100 : 0

      const durations = pageViewsData?.map((pv) => pv.duration || 0) || []
      const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0

      const visitorsChange =
        prevUniqueVisitors > 0
          ? Math.round(((uniqueVisitors - prevUniqueVisitors) / prevUniqueVisitors) * 100 * 10) / 10
          : 0
      const pageViewsChange =
        prevPageViews > 0 ? Math.round(((pageViews - prevPageViews) / prevPageViews) * 100 * 10) / 10 : 0

      setAnalytics({
        visitors: uniqueVisitors,
        pageViews,
        bounceRate: Math.round(bounceRate * 10) / 10,
        avgDuration: Math.round(avgDuration),
        visitorsChange,
        pageViewsChange,
      })
      setIsLoading(false)
    }

    fetchAnalytics()
  }, [site.id, timeRange])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    suffix = "",
  }: {
    title: string
    value: string | number
    change?: number
    icon: React.ElementType
    suffix?: string
  }) => (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-semibold">
              {isLoading ? "-" : value}
              {suffix}
            </p>
            {change !== undefined && change !== 0 && (
              <div
                className={`flex items-center gap-1 text-xs font-medium ${change > 0 ? "text-green-500" : "text-red-500"}`}
              >
                {change > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                <span>{Math.abs(change)}%</span>
              </div>
            )}
          </div>
          <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const defaultTab = hasData === false ? "setup" : "overview"

  return (
    <div>
      <div className="border-b border-border bg-card">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{site.name}</h1>
              <p className="text-sm text-muted-foreground">{site.domain}</p>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-36 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Visitors"
            value={analytics.visitors.toLocaleString()}
            change={analytics.visitorsChange}
            icon={Users}
          />
          <MetricCard
            title="Page Views"
            value={analytics.pageViews.toLocaleString()}
            change={analytics.pageViewsChange}
            icon={Eye}
          />
          <MetricCard title="Bounce Rate" value={analytics.bounceRate} suffix="%" icon={TrendingDown} />
          <MetricCard title="Avg. Duration" value={formatDuration(analytics.avgDuration)} icon={Timer} />
        </div>

        <Tabs defaultValue={defaultTab} key={`${site.id}-${hasData}`} className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="realtime">Realtime</TabsTrigger>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="setup" className={hasData === false ? "relative" : ""}>
              Setup
              {hasData === false && <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full" />}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <Card className="bg-card border-border">
              <MetricsChart siteId={site.id} timeRange={timeRange} />
            </Card>
          </TabsContent>
          <TabsContent value="realtime">
            <RealtimeGlobe siteId={site.id} />
          </TabsContent>
          <TabsContent value="pages">
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <TopPagesTable siteId={site.id} timeRange={timeRange} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="setup">
            <TrackingScript siteId={site.id} domain={site.domain} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
