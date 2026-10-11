"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { Zap } from "lucide-react"

const data = [
  { time: "00:00", visitors: 120, views: 200 },
  { time: "03:00", visitors: 80, views: 150 },
  { time: "06:00", visitors: 150, views: 280 },
  { time: "09:00", visitors: 200, views: 350 },
  { time: "12:00", visitors: 280, views: 450 },
  { time: "15:00", visitors: 350, views: 580 },
  { time: "18:00", visitors: 620, views: 850 },
  { time: "21:00", visitors: 480, views: 720 },
  { time: "23:00", visitors: 380, views: 550 },
]

export function DashboardPreview() {
  return (
    <Card className="border shadow-2xl shadow-black/5 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-foreground" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">Godly</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-pink-500" />
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium">Today</span>
          <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        <div className="grid grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">People</span>
              <div className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <p className="text-2xl font-semibold">1,193</p>
            <p className="text-xs text-emerald-500">+100%</p>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Views</span>
            </div>
            <p className="text-2xl font-semibold">3,766</p>
            <p className="text-xs text-emerald-500">+100%</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Bounced</span>
            <p className="text-2xl font-semibold">34.8%</p>
            <p className="text-xs text-rose-500">+100%</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Duration</span>
            <p className="text-2xl font-semibold">3m 49s</p>
            <p className="text-xs text-emerald-500">+100%</p>
          </div>
        </div>

        <div className="h-64">
          <ChartContainer
            config={{
              visitors: { label: "Visitors", color: "hsl(220, 70%, 60%)" },
              views: { label: "Views", color: "hsl(280, 70%, 60%)" },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220, 70%, 60%)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(220, 70%, 60%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="hsl(280, 70%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis hide />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="hsl(220, 70%, 60%)"
                  strokeWidth={2}
                  fill="url(#colorVisitors)"
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(280, 70%, 60%)"
                  strokeWidth={2}
                  fill="url(#colorViews)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
