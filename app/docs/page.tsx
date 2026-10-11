import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Code, Zap, Shield, BarChart3, ArrowRight } from "lucide-react"

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 rounded-full px-4 py-1">
              Documentation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Get started in minutes</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Add privacy-friendly analytics to your website with just one line of code.
            </p>
          </div>

          {/* Quick Start */}
          <Card className="mb-8 border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Quick Start</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                After signing up and adding your website, copy the tracking script and add it to your site:
              </p>
              <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <code className="text-foreground">
                  {'<script defer src="https://your-domain.com/tracker.js"'}
                  <br />
                  {'  data-site-id="your-site-id"'}
                  <br />
                  {'  data-api="https://your-domain.com/api/track">'}
                  <br />
                  {"</script>"}
                </code>
              </div>
              <p className="text-sm text-muted-foreground">
                Replace <code className="bg-muted px-1.5 py-0.5 rounded">your-domain.com</code> with your analytics
                dashboard URL and <code className="bg-muted px-1.5 py-0.5 rounded">your-site-id</code> with the ID from
                your dashboard.
              </p>
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <CardTitle className="text-lg">Privacy First</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    No cookies required
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    GDPR compliant by default
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    No personal data collection
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    No consent banner needed
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">What We Track</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Page views & unique visitors
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Session duration & bounce rate
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Geographic location (country/city)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    Core Web Vitals (LCP, INP, CLS)
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Framework Examples */}
          <Card className="mb-8 border shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Code className="h-5 w-5 text-orange-600" />
                </div>
                <CardTitle>Framework Examples</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Next.js (App Router)</h4>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code className="text-foreground">
                    {"// app/layout.tsx"}
                    <br />
                    {'import Script from "next/script"'}
                    <br />
                    <br />
                    {"export default function RootLayout({ children }) {"}
                    <br />
                    {"  return ("}
                    <br />
                    {"    <html>"}
                    <br />
                    {"      <body>"}
                    <br />
                    {"        {children}"}
                    <br />
                    {"        <Script"}
                    <br />
                    {'          src="https://your-domain.com/tracker.js"'}
                    <br />
                    {'          data-site-id="your-site-id"'}
                    <br />
                    {'          data-api="https://your-domain.com/api/track"'}
                    <br />
                    {'          strategy="afterInteractive"'}
                    <br />
                    {"        />"}
                    <br />
                    {"      </body>"}
                    <br />
                    {"    </html>"}
                    <br />
                    {"  )"}
                    <br />
                    {"}"}
                  </code>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">React / Vite</h4>
                <div className="bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <code className="text-foreground">
                    {"// index.html"}
                    <br />
                    {"<script defer"}
                    <br />
                    {'  src="https://your-domain.com/tracker.js"'}
                    <br />
                    {'  data-site-id="your-site-id"'}
                    <br />
                    {'  data-api="https://your-domain.com/api/track">'}
                    <br />
                    {"</script>"}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center">
            <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6">
              <Link href="/auth/register">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
