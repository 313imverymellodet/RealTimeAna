"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Logo } from "@/components/brand"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

function Shell({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 justify-center text-lg" />
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_1px_3px_rgb(0_0_0/0.04)] sm:p-8">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{lead}</p>
          {children}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/auth/login" className="text-foreground underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}

export function ForgotPasswordForm({ emailConfigured }: { emailConfigured: boolean }) {
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    const result = await authClient.requestPasswordReset({ email, redirectTo: "/auth/reset" })
    setPending(false)
    if (result.error) {
      setError(result.error.message || "Something went wrong. Try again.")
      return
    }
    setSent(true)
  }

  return (
    <Shell title="Reset your password" lead="Enter your account email and we will send you a link.">
      {!emailConfigured ? (
        <p role="alert" className="mt-6 rounded-2xl bg-muted px-4 py-3 text-sm">
          Password reset by email is not switched on for this site yet. Please contact support.
        </p>
      ) : sent ? (
        <p role="status" className="mt-6 rounded-2xl bg-muted px-4 py-3 text-sm">
          If an account exists for {email}, a reset link is on its way. It works for one hour.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-4">
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
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={pending} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
      )}
    </Shell>
  )
}

export function ResetPasswordForm({ token, invalid }: { token: string | null; invalid: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!token) return
    setPending(true)
    setError(null)
    const result = await authClient.resetPassword({ newPassword: password, token })
    if (result.error) {
      setError(result.error.message || "That link has expired. Request a new one.")
      setPending(false)
      return
    }
    router.push("/auth/login?reset=1")
  }

  if (!token || invalid) {
    return (
      <Shell title="This link has expired" lead="Reset links work once, for one hour.">
        <Button asChild className="mt-6 w-full rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
          <Link href="/auth/forgot">Send a new link</Link>
        </Button>
      </Shell>
    )
  }

  return (
    <Shell title="Choose a new password" lead="You will sign in with it from now on.">
      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby="password-hint"
          />
          <p id="password-hint" className="text-xs text-muted-foreground">
            At least 8 characters.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="rounded-full bg-brand text-brand-foreground hover:bg-brand/90">
          {pending ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </Shell>
  )
}
