import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Activity } from "lucide-react"

export function FooterSection() {
  return (
    <footer className="py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative text-center mb-16 py-16 px-8 rounded-3xl bg-gradient-to-b from-muted/50 to-muted/30 border">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">A new age of web analytics</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Start your 14 day free trial today and see your live visitors in minutes.
          </p>
          <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6">
            <Link href="/auth/register">Start 14 day free trial</Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">No credit card required</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-8 border-t">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-foreground flex items-center justify-center">
              <Activity className="h-5 w-5 text-background" />
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Privacy-first analytics that respects your visitors while giving you the insights you need.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm text-muted-foreground">All systems operational</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-foreground transition-colors">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="hover:text-foreground transition-colors">
                  Register
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-foreground transition-colors">
                  Docs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="/demo" className="hover:text-foreground transition-colors">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-foreground transition-colors">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Compare</h4>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  vs Google Analytics
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-foreground transition-colors">
                  vs Plausible
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© 2025 Analytics. All rights reserved.</p>
          <p>Made with care for privacy</p>
        </div>
      </div>
    </footer>
  )
}
