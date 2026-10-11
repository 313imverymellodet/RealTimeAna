import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"

export function PeopleSection() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
            People
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Don't just track numbers, understand visitors</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Visitors aren't just a number, they're people with their own journey.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
              Profile
            </Badge>
            <p className="text-muted-foreground mb-8">
              Every single visitor gets a profile allowing you to see their journey from start to finish. Visitors can
              optionally be persisted or identified, allowing you to track activity over time, or across devices.
            </p>

            <Card className="border shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-sm font-medium">Today</span>
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                    Session is currently active
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <div className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="font-medium">/pricing</span>
                    <Badge variant="secondary" className="ml-auto">
                      Subscribed
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="font-medium">/</span>
                    <span className="text-muted-foreground text-sm ml-auto">5s</span>
                  </div>
                  <div className="flex items-center gap-4 p-3 rounded-lg">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Direct</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <span className="text-sm text-muted-foreground">11:43 PM</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Follow their journey from start to finish</h3>
            <p className="text-muted-foreground mb-8">
              See how every visitor arrives and interacts with their website. Where they came from, how long they
              stayed, and what made them leave.
            </p>

            <Card className="border shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  <div>
                    <p className="font-semibold">Daryl Ginn</p>
                    <p className="text-sm text-muted-foreground">Identify your logged in users and customers</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Turn anonymous visitors into saved profiles and get insights into how users interact with your website
                  over time.
                </p>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">Activity</p>
                  <p className="text-2xl font-bold">
                    646 <span className="text-sm font-normal text-muted-foreground">events in the last 6 months</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Notice patterns and trends from your visitors</h3>
              <p className="text-muted-foreground">
                Study user patterns and trends over time to understand how often users return, and how active they are.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
