import type { Metadata } from "next"
import { ForgotPasswordForm } from "@/components/auth/password-forms"
import { emailConfigured } from "@/lib/email"

export const metadata: Metadata = { title: "Reset password" }
export const dynamic = "force-dynamic"

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm emailConfigured={emailConfigured} />
}
