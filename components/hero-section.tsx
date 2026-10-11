import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DashboardPreview } from "@/components/dashboard-preview"

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground mb-4">
          An alternative to <span className="font-semibold text-foreground">Plausible</span>
        </p>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6 text-balance">
          Fast, private, realtime web analytics
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Understand your visitors and how they engage with your website or product in realtime.
        </p>
        <div className="flex items-center justify-center gap-4 mb-4">
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-6">
            <Link href="/auth/register">Start 14 day free trial</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full px-6 py-6 bg-transparent">
            <Link href="/demo">See demo</Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">No credit card required</p>
      </div>

      <div className="mt-16 max-w-5xl mx-auto">
        <DashboardPreview />
      </div>
    </section>
  )
}
