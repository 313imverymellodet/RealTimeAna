import { SiteFooter, SiteNav } from "@/components/marketing/site-nav"
import { LEGAL } from "@/lib/legal"

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main id="main" className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated {LEGAL.updated}</p>
        <div className="mt-10 space-y-10">{children}</div>
      </main>
      <SiteFooter />
    </>
  )
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 text-[15px] leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-medium [&_strong]:text-foreground">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      {children}
    </section>
  )
}

export function ContactLine({ purpose }: { purpose: string }) {
  return LEGAL.contactEmail ? (
    <p>
      {purpose}, email{" "}
      <a href={`mailto:${LEGAL.contactEmail}`} className="text-foreground underline underline-offset-4">
        {LEGAL.contactEmail}
      </a>
      .
    </p>
  ) : (
    <p>{purpose}, write to us. A contact address will be listed here.</p>
  )
}
