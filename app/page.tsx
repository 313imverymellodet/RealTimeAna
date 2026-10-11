import { ArrowRight, Bot, Cookie, Feather, Globe2, Link2, Share2 } from "lucide-react"
import Link from "next/link"
import { DashboardView } from "@/components/analytics/dashboard-view"
import { LiveDot } from "@/components/brand"
import { CodeBlock } from "@/components/install-snippet"
import { SiteFooter, SiteNav } from "@/components/marketing/site-nav"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { BETA_PLAN } from "@/lib/plans"

const FEATURES = [
  {
    icon: Globe2,
    title: "Live, not yesterday",
    body: "See how many people are on your site this minute, which pages they are reading and where in the world they are.",
    span: "md:col-span-2",
  },
  {
    icon: Cookie,
    title: "No cookies. No storage.",
    body: "Pulse never writes to the visitor's browser. Unique visitors are counted with an anonymous hash that changes every day.",
    span: "",
  },
  {
    icon: Feather,
    title: "1.3 KB script",
    body: "One deferred script tag, about 1.3 KB gzipped. It works with single-page apps out of the box.",
    span: "",
  },
  {
    icon: Link2,
    title: "Know what sent them",
    body: "Referrers and UTM campaigns are captured automatically, so you can see which post, launch or link actually worked.",
    span: "",
  },
  {
    icon: Share2,
    title: "Public dashboards",
    body: "Flip one switch to get a read-only link you can share with clients, investors or your audience.",
    span: "",
  },
  {
    icon: Bot,
    title: "Honest numbers",
    body: "Known bots are filtered out, and Do Not Track and Global Privacy Control are respected. Time on page counts only while the tab is visible.",
    span: "md:col-span-2",
  },
]

const STEPS = [
  { title: "Add your domain", body: "Create an account and enter the site you want to track." },
  { title: "Paste one line", body: "Drop the script tag into your site's head. No build step, no config." },
  { title: "Watch it live", body: "Your dashboard switches on by itself when the first visit arrives." },
]

const FAQ = [
  {
    q: "Do I need a cookie banner for Pulse?",
    a: "Pulse sets no cookies and stores nothing in the visitor's browser, and it does not track people across sites or days. Whether your site needs a banner still depends on the other tools you run and the law where you operate, so check with someone qualified.",
  },
  {
    q: "How are unique visitors counted without cookies?",
    a: "Each page view is tagged with a one-way hash of the site, the visitor's IP address and browser, mixed with a random salt that is replaced and deleted every day. The IP address itself is never stored, and the same person gets a different hash tomorrow.",
  },
  {
    q: "What does it cost?",
    a: `Pulse is free while it is in beta, up to ${BETA_PLAN.pageviewLimit.toLocaleString("en")} pageviews a month across ${BETA_PLAN.siteLimit} websites. Paid plans for higher volumes will come later.`,
  },
  {
    q: "Will it slow my site down?",
    a: "The script is about 1.3 KB gzipped, loads with defer, and sends one small request per page view.",
  },
  {
    q: "Does it work with Next.js, React or other single-page apps?",
    a: "Yes. Client-side navigation is detected automatically and counted as a new page view.",
  },
]

const SNIPPET = '<script defer data-site-id="YOUR-SITE-ID" src="https://YOUR-PULSE-DOMAIN/tracker.js"></script>'

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="bg-grid pointer-events-none absolute inset-0" aria-hidden />
          <div className="glow-brand pointer-events-none absolute inset-0" aria-hidden />

          <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-10 text-center sm:px-6 sm:pt-28">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <LiveDot />
              Free while in beta
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              See who&apos;s on your site <span className="text-brand">right now</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
              Live web analytics with no cookies and nothing stored in your visitors&apos; browsers. One script tag, and
              traffic shows up on your dashboard in seconds.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-brand px-6 text-brand-foreground hover:bg-brand/90">
                <Link href="/auth/register">
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent px-6">
                <Link href="/demo">Open the live demo</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card. Set up in about a minute.</p>
          </div>

          {/* Product preview: the real dashboard component running on sample data */}
          <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <div className="overflow-hidden rounded-3xl border border-border bg-background/80 shadow-2xl shadow-black/50">
              <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="ml-3 rounded-md bg-secondary px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  sample data
                </span>
              </div>
              <DashboardView
                title="acme.dev"
                subtitle="This is the actual dashboard, shown with sample data"
                statsUrl="/api/demo/stats"
                realtimeUrl="/api/demo/realtime"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 border-t border-border/60 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Everything you check every day. Nothing you never open.
            </h2>
            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className={`rounded-2xl border border-border bg-card/60 p-6 transition-colors hover:border-brand/30 ${feature.span}`}
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-brand/12 text-brand">
                    <feature.icon className="size-4.5" />
                  </span>
                  <h3 className="mt-5 text-lg font-medium tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Live in three steps</h2>
            <ol className="mt-10 grid gap-3 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-2xl border border-border bg-card/60 p-6">
                  <span className="font-mono text-sm text-brand">0{index + 1}</span>
                  <h3 className="mt-3 text-lg font-medium tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <CodeBlock code={SNIPPET} className="mt-3" />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-t border-border/60 py-20 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Free while we&apos;re in beta</h2>
              <p className="mt-4 max-w-md text-muted-foreground">
                Every feature is included. Paid plans for higher volumes will come later.
              </p>
            </div>
            <div className="rounded-2xl border border-brand/30 bg-card/60 p-8">
              <p className="text-sm font-medium text-brand">{BETA_PLAN.name}</p>
              <p className="mt-3 text-5xl font-semibold tracking-tight">
                $0<span className="ml-1 text-base font-normal text-muted-foreground">/ month</span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                <li>{BETA_PLAN.pageviewLimit.toLocaleString("en")} pageviews per month</li>
                <li>{BETA_PLAN.siteLimit} websites</li>
                <li>Live visitors, sources, pages, countries and devices</li>
                <li>Public dashboard links</li>
              </ul>
              <Button asChild className="mt-8 w-full bg-brand text-brand-foreground hover:bg-brand/90">
                <Link href="/auth/register">Start free</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/60 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Questions</h2>
            <Accordion type="single" collapsible className="mt-8">
              {FAQ.map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger className="text-left text-base">{item.q}</AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="relative overflow-hidden border-t border-border/60 py-24 text-center">
          <div className="glow-brand pointer-events-none absolute inset-0" aria-hidden />
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
              Your next visitor is about to land.
            </h2>
            <p className="mt-4 text-muted-foreground">Be watching when they do.</p>
            <Button asChild size="lg" className="mt-8 bg-brand px-6 text-brand-foreground hover:bg-brand/90">
              <Link href="/auth/register">
                Start free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
