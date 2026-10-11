import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function PerformanceSection() {
  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
            Performance
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See how your website performs for real visitors</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Get a breakdown of your website performance metrics from visitors all over the world.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Card className="border shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Experience Score</h3>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    Performance
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeDasharray={251}
                        strokeDashoffset={0}
                        className="text-emerald-500"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">100</span>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">Perfect</p>
                    <p className="text-sm text-muted-foreground">
                      All your visitors had a perfect experience. Flawless.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">Maintain a perfect Experience Score for your visitors</h3>
            <p className="text-muted-foreground mb-8">
              Track real user performance metrics like LCP, INP, CLS, FCP, and TTFB in real time. Your Experience Score
              will reflect what your visitors are truly experiencing on every device and location.
            </p>

            <Card className="border shadow-lg">
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="font-semibold">Great</p>
                  <p className="text-sm text-muted-foreground">ES above 90</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium">/</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">2,340</span>
                      <span className="text-emerald-500 font-semibold">100</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg">
                    <span className="font-medium">/pricing</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">326</span>
                      <span className="text-emerald-500 font-semibold">92</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg">
                    <span className="font-medium">/blog</span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">148</span>
                      <span className="text-yellow-500 font-semibold">88</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h3 className="text-xl font-semibold mb-4">Identify your best performing pages</h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Quickly spot pages where visitors are having the best experience. Learn what makes them perform well and
            apply those insights across your site.
          </p>
        </div>
      </div>
    </section>
  )
}
