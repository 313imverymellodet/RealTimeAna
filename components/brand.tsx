import Link from "next/link"
import { cn } from "@/lib/utils"

// Seats filling up: three taken, one still open
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={cn("size-7", className)} aria-hidden>
      <rect width="28" height="28" rx="8" fill="var(--foreground)" />
      <circle cx="9" cy="10" r="2.6" fill="var(--background)" />
      <circle cx="19" cy="10" r="2.6" fill="var(--background)" />
      <circle cx="9" cy="19" r="2.6" fill="var(--background)" />
      <circle cx="19" cy="19" r="2.1" fill="none" stroke="var(--background)" strokeWidth="1.2" opacity="0.6" />
    </svg>
  )
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-semibold tracking-tight", className)}>
      <LogoMark />
      housecount
    </Link>
  )
}

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex size-2", className)}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-success" />
    </span>
  )
}
