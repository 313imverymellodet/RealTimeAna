import Link from "next/link"
import { cn } from "@/lib/utils"

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <span className="relative flex size-7 items-center justify-center rounded-lg bg-brand text-brand-foreground">
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden>
          <path d="M2 12h4l3-7 5 14 3-7h5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      Pulse
    </Link>
  )
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2", className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-70" />
      <span className="relative inline-flex size-2 rounded-full bg-brand" />
    </span>
  )
}
