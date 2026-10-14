import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"
import { socialProviders } from "@/lib/auth"

export const metadata: Metadata = { title: "Sign in" }
export const dynamic = "force-dynamic"

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reset?: string }> }) {
  const { reset } = await searchParams
  return (
    <AuthForm
      mode="login"
      providers={socialProviders}
      notice={reset ? "Password updated. Sign in with your new password." : undefined}
    />
  )
}
