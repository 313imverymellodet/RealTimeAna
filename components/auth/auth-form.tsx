"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

interface AuthFormProps {
  mode: "login" | "register"
  providers: { github: boolean; google: boolean }
  // Website typed on the landing page; added to the new account right after sign-up
  domain?: string
}

export function AuthForm({ mode, providers, domain }: AuthFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isRegister = mode === "register"

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError(null)

    const result = isRegister
      ? await authClient.signUp.email({ email, password, name: email.split("@")[0] })
      : await authClient.signIn.email({ email, password })

    if (result.error) {
      setError(result.error.message || "Something went wrong. Try again.")
      setPending(false)
      return
    }

    if (isRegister && domain) {
      // Best effort: if this fails the dashboard simply asks for the website again
      await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      }).catch(() => {})
    }

    router.push("/dashboard")
    router.refresh()
  }

  const social = (provider: "github" | "google") => {
    setPending(true)
    authClient.signIn.social({ provider, callbackURL: "/dashboard" })
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-muted p-6">

      <div className="relative w-full max-w-sm">
        <Logo className="mb-8 justify-center text-lg" />

        <div className="rounded-3xl border border-border bg-card shadow-[0_1px_3px_rgb(0_0_0/0.04)] p-6 sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">{isRegister ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isRegister
              ? domain
                ? `One step to start tracking ${domain}. Free during beta.`
                : "Free during beta. No credit card."
              : "Sign in to see your live traffic."}
          </p>

          {(providers.github || providers.google) && (
            <>
              <div className="mt-6 grid gap-2">
                {providers.github && (
                  <Button type="button" variant="outline" disabled={pending} onClick={() => social("github")}>
                    Continue with GitHub
                  </Button>
                )}
                {providers.google && (
                  <Button type="button" variant="outline" disabled={pending} onClick={() => social("google")}>
                    Continue with Google
                  </Button>
                )}
              </div>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          <form onSubmit={submit} className={providers.github || providers.google ? "grid gap-4" : "mt-6 grid gap-4"}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegister ? "new-password" : "current-password"}
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-describedby={isRegister ? "password-hint" : undefined}
              />
              {isRegister && (
                <p id="password-hint" className="text-xs text-muted-foreground">
                  At least 8 characters.
                </p>
              )}
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
              {pending ? "One moment…" : isRegister ? "Create account" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? "Already have an account? " : "New to Pulse? "}
          <Link
            href={isRegister ? "/auth/login" : "/auth/register"}
            className="text-foreground underline-offset-4 hover:underline"
          >
            {isRegister ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>
    </main>
  )
}
