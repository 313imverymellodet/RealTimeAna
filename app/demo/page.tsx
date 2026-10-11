"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Activity, Users, Eye, Timer, TrendingDown, ArrowUpRight, ArrowRight, Globe, Sparkles } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Demo data
const chartData = [
  { time: "00:00", visitors: 45 },
  { time: "02:00", visitors: 23 },
  { time: "04:00", visitors: 12 },
  { time: "06:00", visitors: 34 },
  { time: "08:00", visitors: 89 },
  { time: "10:00", visitors: 156 },
  { time: "12:00", visitors: 234 },
  { time: "14:00", visitors: 267 },
  { time: "16:00", visitors: 245 },
  { time: "18:00", visitors: 189 },
  { time: "20:00", visitors: 167 },
  { time: "22:00", visitors: 98 },
]

const topPages = [
  { path: "/", views: 2340, score: 100 },
  { path: "/pricing", views: 892, score: 98 },
  { path: "/blog", views: 567, score: 95 },
  { path: "/docs", views: 445, score: 92 },
  { path: "/about", views: 234, score: 88 },
]

const realtimeVisitors = [
  { country: "United States", city: "New York", page: "/pricing" },
  { country: "United Kingdom", city: "London", page: "/" },
  { country: "Germany", city: "Berlin", page: "/docs" },
  { country: "France", city: "Paris", page: "/blog" },
  { country: "Japan", city: "Tokyo", page: "/" },
]

export default function DemoPage() {
  const [timeRange, setTimeRange] = useState("today")

  return (
    <main className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-primary text-primary-foreground py-3 px-4 text-center text-sm">
        <span className="font-medium">This is a demo with sample data.</span>
        <Link href="/auth/register" className="ml-2 underline underline-offset-4 hover:no-underline">
          Create your account to track real visitors →
        </Link>
      </div>

      {/* Header */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">Analytics</span>
            <Badge variant="secondary" className="ml-2">
              Demo
            </Badge>
          </Link>
          <Button asChild className="rounded-full">
            <Link href="/auth/register">Get Started Free</Link>
          </Button>
        </div>
      </header>

      {/* Site Header */}
      <div className="border-b bg-background">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">demo-site.com</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Demo Dashboard</h1>
              </div>
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-44 bg-background border shadow-sm">
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

      {/* Dashboard Content */}
      <div className="p-6 space-y-6 bg-muted/30 min-h-[calc(100vh-180px)]">
        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Visitors" value="1,849" change={12.5} icon={Users} />
          <MetricCard title="Page Views" value="4,521" change={8.2} icon={Eye} />
          <MetricCard title="Bounce Rate" value="34.2" suffix="%" icon={TrendingDown} />
          <MetricCard title="Avg. Duration" value="2m 45s" icon={Timer} />
        </div>

        {/* Experience Score */}
        <Card className="border shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Experience Score</h3>
                  <p className="text-sm text-muted-foreground">Based on Core Web Vitals</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-emerald-600">96</div>
                <p className="text-sm text-muted-foreground">Excellent</p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-4 pt-4 border-t">
              <VitalMetric label="LCP" value="1.2s" status="good" />
              <VitalMetric label="INP" value="45ms" status="good" />
              <VitalMetric label="CLS" value="0.02" status="good" />
              <VitalMetric label="FCP" value="0.8s" status="good" />
              <VitalMetric label="TTFB" value="180ms" status="good" />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-background border shadow-sm h-11">
            <TabsTrigger value="overview" className="data-[state=active]:bg-muted">
              Overview
            </TabsTrigger>
            <TabsTrigger value="realtime" className="data-[state=active]:bg-muted">
              Realtime
            </TabsTrigger>
            <TabsTrigger value="pages" className="data-[state=active]:bg-muted">
              Pages
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Visitors Over Time</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="visitors"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorVisitors)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="realtime">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="font-semibold">Live Visitors</h3>
                  <Badge variant="secondary">5 online now</Badge>
                </div>
                <div className="space-y-3">
                  {realtimeVisitors.map((visitor, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                          {visitor.country.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {visitor.city}, {visitor.country}
                          </p>
                          <p className="text-xs text-muted-foreground">{visitor.page}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Just now
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages">
            <Card className="border shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Top Pages</h3>
                <div className="space-y-1">
                  <div className="grid grid-cols-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <span>Page</span>
                    <span className="text-right">Views</span>
                    <span className="text-right">Score</span>
                  </div>
                  {topPages.map((page, i) => (
                    <div key={i} className="grid grid-cols-3 py-3 border-t items-center">
                      <span className="font-medium text-sm">{page.path}</span>
                      <span className="text-right text-sm text-muted-foreground">{page.views.toLocaleString()}</span>
                      <span
                        className={`text-right text-sm font-medium ${
                          page.score >= 90 ? "text-emerald-600" : page.score >= 70 ? "text-amber-600" : "text-rose-600"
                        }`}
                      >
                        {page.score}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <Card className="border shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
          <CardContent className="p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Ready to track your own visitors?</h3>
            <p className="text-muted-foreground mb-6">Get started free with no credit card required.</p>
            <Button asChild className="rounded-full px-8">
              <Link href="/auth/register">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  suffix = "",
}: {
  title: string
  value: string
  change?: number
  icon: React.ElementType
  suffix?: string
}) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-3xl font-bold tracking-tight">
              {value}
              {suffix}
            </p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>{change}%</span>
              </div>
            )}
          </div>
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function VitalMetric({
  label,
  value,
  status,
}: { label: string; value: string; status: "good" | "needs-improvement" | "poor" }) {
  const statusColors = {
    good: "text-emerald-600",
    "needs-improvement": "text-amber-600",
    poor: "text-rose-600",
  }

  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`font-semibold ${statusColors[status]}`}>{value}</p>
    </div>
  )
}
