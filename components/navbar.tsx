import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Activity } from "lucide-react"

export function Navbar() {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      <nav className="flex items-center gap-1 bg-foreground text-background rounded-full px-2 py-2 shadow-lg">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-background/10 hover:bg-background/20 transition-colors"
        >
          <Activity className="w-5 h-5 text-background" />
        </Link>
        <Link
          href="#pricing"
          className="px-4 py-2 text-sm font-medium text-background/80 hover:text-background transition-colors"
        >
          Pricing
        </Link>
        <Link
          href="/docs"
          className="px-4 py-2 text-sm font-medium text-background/80 hover:text-background transition-colors"
        >
          Docs
        </Link>
        <Link
          href="/auth/login"
          className="px-4 py-2 text-sm font-medium text-background/80 hover:text-background transition-colors"
        >
          Login
        </Link>
        <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-5">
          <Link href="/auth/register">Register</Link>
        </Button>
      </nav>
    </header>
  )
}
