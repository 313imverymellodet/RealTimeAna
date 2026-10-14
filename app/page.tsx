import { ArrowRight, Bot, Cookie, Feather, Globe2, Link2, Route, Share2, Target } from "lucide-react"
import Link from "next/link"
import { DashboardView } from "@/components/analytics/dashboard-view"
import { LiveDot } from "@/components/brand"
import { CodeBlock } from "@/components/install-snippet"
import { SiteFooter, SiteNav } from "@/components/marketing/site-nav"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BETA_PLAN } from "@/lib/plans"

// Order follows the three messages: live, what worked, respectful
const FEATURES = [
  {
    icon: Globe2,
    title: "Watch a story land",
    body: "Every reader gets a seat. Watch the house fill as a story takes off, see what is showing right now, and know the moment you set a new house record.",
    span: "md:col-span-2",
  },
  {
    icon: Target,
    title: "Count what matters",
    body: "Mark newsletter signups, memberships and affiliate clicks with one line. Conversion rate and revenue sit next to your traffic.",
    span: "",
  },
  {
    icon: Link2,
    title: "Know what brought them",
    body: "Search, social, newsletter or direct: each seat is coloured by how the reader arrived. Tracked links show what every single post on X, Facebook or Bluesky brought in.",
    span: "",
  },
  {
    icon: Route,
    title: "From story to subscriber",
    body: "Lay out the path from an article to a signup and see where readers drop off. Open any anonymous reader to follow their visit page by page.",
    span: "md:col-span-2",
  },
  {
    icon: Share2,
    title: "Open house",
    body: "Flip one switch for a read-only link to your numbers, plus a weekly house card image to post for sponsors and your audience.",
    span: "",
  },
  {
    icon: Cookie,
    title: "No cookies. Nothing stored.",
    body: "Housecount never writes to your readers' browsers. Unique readers are counted with an anonymous hash that changes every day.",
    span: "",
  },
  {
    icon: Bot,
    title: "Honest numbers",
    body: "Known bots are filtered out, and Do Not Track is respected. Time on a story counts only while the tab is visible.",
    span: "",
  },
  {
    icon: Feather,
    title: "One line to install",
    body: "A single deferred script tag, about 1.7 KB gzipped. It works on WordPress, Ghost, Webflow, Next.js and anything else that serves HTML.",
    span: "md:col-span-3",
  },
]

const STEPS = [
  { title: "Add your site", body: "Create an account and enter the publication you want to watch." },
  { title: "Paste one line", body: "Drop the script tag into your site's head. No build step, no config." },
  { title: "Watch the house fill", body: "Your dashboard switches on by itself when the first reader arrives." },
]

const FAQ = [
  {
    q: "Who is Housecount for?",
    a: "Independent publishers and creators: blogs, newsletters, niche news sites and small media brands. It works on any website, and goals and revenue work the same way for a store or an app.",
  },
  {
    q: "Do I need a cookie banner for Housecount?",
    a: "Housecount sets no cookies and stores nothing in your readers' browsers, and it does not track people across sites or days. Whether your site needs a banner still depends on the other tools you run and the law where you operate, so check with someone qualified.",
  },
  {
    q: "How are unique readers counted without cookies?",
    a: "Each page view is tagged with a one-way hash of the site, the reader's IP address and browser, mixed with a random salt that is replaced and deleted every day. The IP address itself is never stored, and the same person gets a different hash tomorrow.",
  },
  {
    q: "Can I follow members across visits?",
    a: "Yes. If readers sign in on your site, pass their member ID and Housecount follows that person across days and devices. Only a one-way hash of the ID is stored.",
  },
  {
    q: "What does it cost?",
    a: `Housecount is free while it is in beta, up to ${BETA_PLAN.pageviewLimit.toLocaleString("en")} pageviews a month across ${BETA_PLAN.siteLimit} sites. Paid plans for higher volumes will come later.`,
  },
  {
    q: "Will it slow my site down?",
    a: "The script is about 1.7 KB gzipped, loads with defer, and sends one small request per page view.",
  },
]

const SNIPPET = '<script defer data-site-id="YOUR-SITE-ID" src="https://YOUR-HOUSECOUNT-DOMAIN/tracker.js"></script>'

export default function Home() {
  return (
    <>
      <SiteNav />
      <main id="main">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="relative mx-auto max-w-6xl px-4 pt-20 pb-12 text-center sm:px-6 sm:pt-28">
            <p className="mx-auto inline-flex items-center gap-2 rounded-full bg-muted px-3.5 py-1.5 text-xs font-medium text-muted-foreground">
              <LiveDot />
              Free while in beta
            </p>
            <h1 className="mx-auto mt-6 max-w-4xl text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-7xl">
              Know who&apos;s <span className="text-brand-ink">in the house.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-pretty text-muted-foreground sm:text-2xl sm:leading-snug">
              Live analytics for independent publishers and creators. See how many people are reading right now,
              what brought them, and which stories and sources lead to subscribers.
            </p>
            <form
              action="/auth/register"
              className="mx-auto mt-10 flex max-w-md flex-col gap-2 sm:flex-row"
              aria-label="Add your site"
            >
              <label htmlFor="hero-domain" className="sr-only">
                Your website
              </label>
              <Input
                id="hero-domain"
                name="domain"
                placeholder="yoursite.com"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                inputMode="url"
                className="h-12 flex-1 rounded-full bg-background px-5"
              />
              <Button type="submit" size="lg" className="h-12 rounded-full bg-brand px-6 text-brand-foreground hover:bg-brand/90">
                Add my site
                <ArrowRight className="size-4" />
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Free to start. One script tag. No cookies.{" "}
              <Link href="/demo" className="text-foreground underline underline-offset-4">
                See the live demo
              </Link>
            </p>
          </div>

          {/* Product preview: the real dashboard component running on sample data */}
          <div className="relative mx-auto max-w-6xl px-4 pb-20 sm:px-6">
            <div className="overflow-hidden rounded-[2rem] border border-border bg-muted shadow-[0_30px_80px_-20px_rgb(0_0_0/0.18)]">
              <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-3">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="ml-3 rounded-md bg-secondary px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  sample data
                </span>
              </div>
              <DashboardView
                title="The Northside Post"
                subtitle="This is the actual dashboard, shown with sample data"
                statsUrl="/api/demo/stats"
                realtimeUrl="/api/demo/realtime"
                funnelsUrl="/api/demo/funnels"
                visitorsUrl="/api/demo/visitors"
                siteDomain="northsidepost.example"
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-20 bg-muted py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="mx-auto max-w-3xl text-center text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Everything you check after you hit publish.
            </h2>
            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <article
                  key={feature.title}
                  className={`rounded-[1.75rem] bg-card p-8 ${feature.span}`}
                >
                  <span className="flex size-10 items-center justify-center rounded-full bg-brand/10 text-brand-ink">
                    <feature.icon className="size-4.5" />
                  </span>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 py-24 sm:py-32">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-4xl font-semibold tracking-tight sm:text-6xl">Live in three steps</h2>
            <ol className="mt-14 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-[1.75rem] bg-muted p-8">
                  <span className="font-mono text-sm text-brand-ink">0{index + 1}</span>
                  <h3 className="mt-3 text-lg font-medium tracking-tight">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
            <CodeBlock code={SNIPPET} className="mt-4" />
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 bg-muted py-24 sm:py-32">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">Free while we&apos;re in beta</h2>
              <p className="mt-5 max-w-md text-lg text-muted-foreground">
                Every feature is included. Paid plans for bigger audiences will come later.
              </p>
            </div>
            <div className="rounded-[1.75rem] bg-card p-10 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.2)]">
              <p className="text-sm font-medium text-brand-ink">{BETA_PLAN.name}</p>
              <p className="mt-3 text-5xl font-semibold tracking-tight">
                $0<span className="ml-1 text-base font-normal text-muted-foreground">/ month</span>
              </p>
              <ul className="mt-6 space-y-2.5 text-sm">
                <li>{BETA_PLAN.pageviewLimit.toLocaleString("en")} pageviews per month</li>
                <li>{BETA_PLAN.siteLimit} sites</li>
                <li>Live readers, sources, stories, countries and devices</li>
                <li>Signups, conversion rate and revenue by source</li>
                <li>Funnels and reader journeys</li>
                <li>Open-house links for sponsors</li>
              </ul>
              <Button asChild className="mt-8 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
                <Link href="/auth/register">Start free</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/60 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-4xl font-semibold tracking-tight sm:text-6xl">Questions</h2>
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
        <section className="relative overflow-hidden bg-muted py-28 text-center sm:py-36">
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6">
            <h2 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
              Your next reader is about to walk in.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground sm:text-xl">Be there when they do.</p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-brand px-6 text-brand-foreground hover:bg-brand/90">
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
