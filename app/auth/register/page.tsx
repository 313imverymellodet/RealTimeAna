import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"
import { socialProviders } from "@/lib/auth"
import { isValidDomain, normalizeDomain } from "@/lib/sites"

export const metadata: Metadata = { title: "Create account" }
export const dynamic = "force-dynamic"

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ domain?: string }> }) {
  const raw = (await searchParams).domain
  const domain = typeof raw === "string" ? normalizeDomain(raw) : ""

  return <AuthForm mode="register" providers={socialProviders} domain={isValidDomain(domain) ? domain : undefined} />
}
