import "server-only"
import { createHmac, timingSafeEqual } from "node:crypto"

// Email goes out through Resend's HTTP API. Without RESEND_API_KEY nothing is
// sent: the message is written to the server log instead, which is enough to
// develop against and to recover a reset link in an emergency.

export const emailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || "http://localhost:3000").replace(/\/$/, "")

interface Message {
  to: string
  subject: string
  // Plain paragraphs; the HTML version is built from the same content
  lines: string[]
  button?: { label: string; url: string }
  footer?: string
  // Extra HTML placed between the lines and the button (already escaped by the caller)
  html?: string
}

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
}

function render(message: Message) {
  const paragraphs = message.lines
    .map((line) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#1d1d1f">${escapeHtml(line)}</p>`)
    .join("")
  const button = message.button
    ? `<p style="margin:22px 0"><a href="${escapeHtml(message.button.url)}" style="display:inline-block;background:#f5a623;color:#1d1d1f;font-weight:600;font-size:15px;text-decoration:none;padding:11px 22px;border-radius:999px">${escapeHtml(message.button.label)}</a></p>`
    : ""
  const footer = `<p style="margin:26px 0 0;font-size:12px;line-height:1.5;color:#6e6e73">${message.footer ?? "Housecount. Know who's in the house."}</p>`

  return `<div style="background:#f5f5f7;padding:28px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"><div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:20px;padding:30px"><p style="margin:0 0 20px;font-size:17px;font-weight:600;color:#1d1d1f">housecount</p>${paragraphs}${message.html ?? ""}${button}${footer}</div></div>`
}

export async function sendEmail(message: Message): Promise<boolean> {
  const text = [...message.lines, message.button ? `${message.button.label}: ${message.button.url}` : ""]
    .filter(Boolean)
    .join("\n\n")

  if (!emailConfigured) {
    console.log(`[email not configured] To: ${message.to} | ${message.subject}\n${text}`)
    return false
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: render(message),
        text,
      }),
    })
    if (!response.ok) {
      console.error("Email send failed:", response.status, await response.text())
      return false
    }
    return true
  } catch (error) {
    console.error("Email send failed:", error)
    return false
  }
}

// Signed link that turns off the weekly summary without signing in
function sign(userId: string) {
  return createHmac("sha256", process.env.BETTER_AUTH_SECRET || "dev").update(`unsubscribe|${userId}`).digest("hex").slice(0, 32)
}

export function unsubscribeUrl(userId: string) {
  return `${siteUrl}/api/email/unsubscribe?u=${encodeURIComponent(userId)}&t=${sign(userId)}`
}

export function verifyUnsubscribe(userId: string, token: string) {
  const expected = Buffer.from(sign(userId))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export function appUrl(path: string) {
  return `${siteUrl}${path}`
}
