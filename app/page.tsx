import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart3, Globe2, Shield, Zap, Users, Clock } from "lucide-react"
import { HomeGlobe } from "@/components/home-globe"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Pulse</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Docs
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm text-muted-foreground">Now tracking 10M+ page views</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6">
            Real-time analytics
            <br />
            <span className="text-muted-foreground">for modern teams</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            Understand your visitors and how they engage with your website. Privacy-first, lightning fast, beautifully
            simple.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" className="gap-2 px-8">
                Start for free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="outline" size="lg" className="px-8 bg-transparent">
                View demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <HomeGlobe />
          <div className="rounded-xl border border-border bg-card p-2 shadow-2xl shadow-black/20 mt-12">
            <div className="rounded-lg bg-background border border-border overflow-hidden">
              <div className="border-b border-border px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                  <div className="h-3 w-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-muted rounded-md px-4 py-1 text-xs text-muted-foreground">
                    pulse.analytics/dashboard
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Visitors", value: "12,847", change: "+12.5%" },
                    { label: "Page Views", value: "48,293", change: "+8.2%" },
                    { label: "Bounce Rate", value: "32.4%", change: "-2.1%" },
                    { label: "Avg. Duration", value: "3m 42s", change: "+15.3%" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
                      <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                      <div className="text-2xl font-semibold">{stat.value}</div>
                      <div className={`text-xs ${stat.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                        {stat.change}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg border border-border bg-muted/30 h-48 flex items-center justify-center">
                  <div className="text-muted-foreground text-sm">Interactive Chart Area</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Powerful analytics without the complexity. Get insights that matter.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Sub-second load times. Your analytics shouldn't slow you down.",
              },
              {
                icon: Shield,
                title: "Privacy First",
                desc: "GDPR compliant. No cookies required. No consent banners.",
              },
              {
                icon: Globe2,
                title: "Real-time Globe",
                desc: "Watch visitors arrive from around the world in real-time.",
              },
              {
                icon: Users,
                title: "Visitor Insights",
                desc: "Understand who your visitors are and where they come from.",
              },
              { icon: Clock, title: "Session Tracking", desc: "See how long visitors stay and what pages they view." },
              { icon: BarChart3, title: "Custom Reports", desc: "Build reports that match your business needs." },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border bg-card p-6 hover:bg-accent/50 transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <feature.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 sm:px-6 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple pricing</h2>
            <p className="text-muted-foreground">Start free, upgrade when you need more.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-xl border border-border bg-card p-8">
              <div className="text-sm text-muted-foreground mb-2">Free</div>
              <div className="text-4xl font-bold mb-4">$0</div>
              <p className="text-sm text-muted-foreground mb-6">Perfect for personal projects</p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Up to 10k page views/mo
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 1 website
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> 30 day data retention
                </li>
              </ul>
              <Link href="/auth/register">
                <Button variant="outline" className="w-full bg-transparent">
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="rounded-xl border-2 border-primary bg-card p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
                Popular
              </div>
              <div className="text-sm text-muted-foreground mb-2">Pro</div>
              <div className="text-4xl font-bold mb-4">
                $9<span className="text-lg font-normal text-muted-foreground">/mo</span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">For growing businesses</p>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Unlimited page views
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Unlimited websites
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Forever data retention
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-green-500">✓</span> Real-time globe view
                </li>
              </ul>
              <Link href="/auth/register">
                <Button className="w-full">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 border-t border-border">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <BarChart3 className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-semibold">Pulse</span>
            </div>
            <div className="text-sm text-muted-foreground">© 2025 Pulse Analytics. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </main>
  )
}
