import type { Metadata } from "next"
import Link from "next/link"
import { CodeBlock } from "@/components/install-snippet"
import { SiteFooter, SiteNav } from "@/components/marketing/site-nav"

export const metadata: Metadata = {
  title: "Docs",
  description: "Install Pulse on any website and see exactly what it collects.",
}

const HTML = '<script defer data-site-id="YOUR-SITE-ID" src="https://YOUR-PULSE-DOMAIN/tracker.js"></script>'

const NEXT = `// app/layout.tsx
import Script from "next/script"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="https://YOUR-PULSE-DOMAIN/tracker.js"
          data-site-id="YOUR-SITE-ID"
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}`

const ASTRO = `---
// src/layouts/Layout.astro
---
<head>
  <script is:inline defer data-site-id="YOUR-SITE-ID"
    src="https://YOUR-PULSE-DOMAIN/tracker.js"></script>
</head>`

const GOAL_JS = `// A signup
window.pulse?.("signup")

// A sale worth 49
window.pulse?.("purchase", { revenue: 49 })`

const GOAL_HTML = `<button data-pulse-goal="signup">Create account</button>

<a href="/thanks" data-pulse-goal="purchase" data-pulse-revenue="49">Buy now</a>`

const SECTIONS = [
  { id: "install", label: "Install" },
  { id: "frameworks", label: "Framework guides" },
  { id: "verify", label: "Check it works" },
  { id: "goals", label: "Goals and revenue" },
  { id: "funnels", label: "Funnels and journeys" },
  { id: "data", label: "What we collect" },
  { id: "sharing", label: "Public dashboards" },
]

const COLLECTED = [
  ["Page path", "The path of the page viewed, without the query string."],
  ["Referrer", "Only the hostname of the site that linked to you."],
  ["Campaign tags", "utm_source, utm_medium and utm_campaign, when present in the URL."],
  ["Device", "Device type, browser and operating system, read from the user agent."],
  ["Location", "Country, region and city, derived from the IP address and rounded to roughly 11 km."],
  ["Time on page", "Seconds the tab was visible."],
  ["Goals", "The goal names and revenue amounts your own code reports."],
]

const NOT_COLLECTED = [
  "No cookies, localStorage or any other browser storage.",
  "No IP addresses are stored. The IP is used in memory to derive location and a daily hash, then discarded.",
  "No cross-site or cross-day identifier. The visitor hash uses a random salt that is deleted every day.",
  "No names, emails, form contents, keystrokes or session recordings.",
  "Browsers sending Do Not Track or Global Privacy Control are not counted at all.",
]

function Heading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-24 text-2xl font-semibold tracking-tight">
      {children}
    </h2>
  )
}

export default function DocsPage() {
  return (
    <>
      <SiteNav />
      <main id="main" className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Docs sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-2 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className="text-muted-foreground hover:text-foreground">
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <article className="max-w-2xl space-y-14">
          <header>
            <h1 className="text-4xl font-semibold tracking-tight">Docs</h1>
            <p className="mt-3 text-muted-foreground">
              Pulse is one script tag. Your personal snippet, with your site ID filled in, is in the dashboard after you{" "}
              <Link href="/auth/register" className="text-foreground underline underline-offset-4">
                add a website
              </Link>
              .
            </p>
          </header>

          <section className="space-y-4">
            <Heading id="install">Install</Heading>
            <p className="text-muted-foreground">
              Paste the snippet into the <code className="font-mono text-foreground">&lt;head&gt;</code> of every page
              you want to track.
            </p>
            <CodeBlock code={HTML} />
            <p className="text-sm text-muted-foreground">
              Events are accepted only from the domain you registered and its subdomains.
            </p>
          </section>

          <section className="space-y-4">
            <Heading id="frameworks">Framework guides</Heading>
            <h3 className="font-medium">Next.js</h3>
            <CodeBlock code={NEXT} />
            <h3 className="pt-2 font-medium">Astro</h3>
            <CodeBlock code={ASTRO} />
            <h3 className="pt-2 font-medium">WordPress, Webflow, Framer, Shopify</h3>
            <p className="text-muted-foreground">
              Each has a setting for custom code in the site head. Paste the HTML snippet there and publish.
            </p>
            <p className="text-sm text-muted-foreground">
              Single-page apps need nothing extra: client-side route changes are counted as page views.
            </p>
          </section>

          <section className="space-y-4">
            <Heading id="verify">Check it works</Heading>
            <ol className="list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>Publish your site with the snippet in place.</li>
              <li>Open your live site in a new tab.</li>
              <li>Your Pulse dashboard switches from the install screen to live charts within a few seconds.</li>
            </ol>
            <p className="text-sm text-muted-foreground">
              Nothing showing? Visits from localhost are ignored, ad blockers may block the script, and browsers with Do
              Not Track turned on are not counted.
            </p>
          </section>

          <section className="space-y-4">
            <Heading id="goals">Goals and revenue</Heading>
            <p className="text-muted-foreground">
              A goal is any action you care about: a signup, a demo request, a sale. Report one from your own code once
              the Pulse script has loaded:
            </p>
            <CodeBlock code={GOAL_JS} />
            <p className="text-muted-foreground">Or mark a button or link, with no JavaScript:</p>
            <CodeBlock code={GOAL_HTML} />
            <p className="text-sm text-muted-foreground">
              Goal names can use letters, numbers, spaces, dashes and underscores. Revenue is a plain number in your
              currency. Each goal is credited to the referrer or campaign that started that visit, which is what powers
              the revenue figures in the Sources panel.
            </p>
            <p className="text-sm text-muted-foreground">
              Revenue is the amount your site reports, so send it from your confirmation page or after a successful
              payment. Tag links with <code className="font-mono text-foreground">?utm_campaign=name</code> or{" "}
              <code className="font-mono text-foreground">?ref=name</code> to see campaigns.
            </p>
          </section>

          <section className="space-y-4">
            <Heading id="funnels">Funnels and journeys</Heading>
            <p className="text-muted-foreground">
              A funnel is an ordered list of two to six steps, each a page or a goal. Create one from the Funnels panel
              on your dashboard. A page step ending in <code className="font-mono text-foreground">*</code> matches
              everything under it, so <code className="font-mono text-foreground">/blog/*</code> covers every post.
            </p>
            <p className="text-muted-foreground">
              The Visitor journeys panel lists recent anonymous visitors. Open one to see the pages they viewed and the
              goals they completed, in order, with where they came from.
            </p>
            <p className="text-sm text-muted-foreground">
              Because a visitor is only recognised for one day, funnels and journeys cover what a person does within a
              single day. Someone who signs up today and buys next week appears as two separate visitors. Journeys are
              visible only to you, never on a public dashboard link.
            </p>
          </section>

          <section className="space-y-4">
            <Heading id="data">What we collect</Heading>
            <dl className="divide-y divide-border rounded-2xl border border-border bg-card/60">
              {COLLECTED.map(([term, detail]) => (
                <div key={term} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[160px_1fr]">
                  <dt className="text-sm font-medium">{term}</dt>
                  <dd className="text-sm text-muted-foreground">{detail}</dd>
                </div>
              ))}
            </dl>
            <h3 className="pt-2 font-medium">What we do not collect</h3>
            <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
              {NOT_COLLECTED.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Because the visitor hash rotates daily, someone who returns on a different day is counted as a new
              visitor. Multi-day visitor totals are therefore the sum of daily uniques.
            </p>
          </section>

          <section className="space-y-4">
            <Heading id="sharing">Public dashboards</Heading>
            <p className="text-muted-foreground">
              In Settings, turn on <span className="text-foreground">Public dashboard</span> for a website to get a
              read-only link. Turn it off and the link stops working immediately.
            </p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  )
}
