import "server-only"
import { eq, sql } from "drizzle-orm"
import { getDb, schema } from "@/lib/db"
import { appUrl, emailConfigured, escapeHtml, sendEmail, unsubscribeUrl } from "@/lib/email"
import { getStats } from "@/lib/stats"

// Mondays from 13:00 UTC (morning in the Americas, afternoon in Europe)
function isSendWindow(now: Date) {
  return now.getUTCDay() === 1 && now.getUTCHours() >= 13
}

function change(current: number, previous: number) {
  if (previous === 0) return current > 0 ? "new" : "no change"
  const percent = Math.round(((current - previous) / previous) * 100)
  return percent === 0 ? "no change" : `${percent > 0 ? "up" : "down"} ${Math.abs(percent)}%`
}

// Sends each account one summary of the past 7 days. Safe to call often and
// from several instances: an account is claimed in the database before its
// email is built, so it can only be sent once per week.
export async function sendWeeklySummaries(now = new Date()): Promise<number> {
  if (!emailConfigured || !isSendWindow(now)) return 0

  const db = getDb()
  const owners = await db
    .selectDistinct({ id: schema.user.id, email: schema.user.email })
    .from(schema.user)
    .innerJoin(schema.sites, eq(schema.sites.userId, schema.user.id))

  let sent = 0
  for (const owner of owners) {
    const claimed = await db
      .insert(schema.usage)
      .values({ userId: owner.id, pageviews: 0, summarySentAt: now })
      .onConflictDoUpdate({
        target: schema.usage.userId,
        set: { summarySentAt: now },
        setWhere: sql`${schema.usage.weeklySummary} and (${schema.usage.summarySentAt} is null or ${schema.usage.summarySentAt} < now() - interval '6 days')`,
      })
      .returning({ userId: schema.usage.userId })
    if (claimed.length === 0) continue

    const sites = await db.select().from(schema.sites).where(eq(schema.sites.userId, owner.id))
    const lines: string[] = []
    let blocks = ""
    let total = 0

    for (const site of sites) {
      const stats = await getStats(site.id, "7d", "UTC")
      const readers = stats.totals.visitors
      if (readers === 0 && stats.previous.visitors === 0) continue
      total += readers

      const topStory = stats.pages[0]?.label
      const topSource = stats.channels[0]?.label
      const parts = [
        `${readers.toLocaleString("en")} readers (${change(readers, stats.previous.visitors)})`,
        topStory ? `top story ${topStory === "/" ? "Front page" : topStory}` : "",
        topSource ? `most came from ${topSource}` : "",
        stats.totals.conversions > 0 ? `${stats.totals.conversions.toLocaleString("en")} goals completed` : "",
        stats.totals.revenueCents > 0 ? `$${(stats.totals.revenueCents / 100).toLocaleString("en")} reported revenue` : "",
      ].filter(Boolean)

      lines.push(`${site.domain}: ${parts.join(", ")}.`)
      blocks += `<div style="margin:0 0 14px;padding:16px 18px;background:#f5f5f7;border-radius:14px"><p style="margin:0;font-size:13px;color:#6e6e73">${escapeHtml(site.domain)}</p><p style="margin:4px 0 6px;font-size:30px;font-weight:700;letter-spacing:-0.5px;color:#1d1d1f">${readers.toLocaleString("en")} <span style="font-size:14px;font-weight:400;color:#6e6e73">readers, ${escapeHtml(change(readers, stats.previous.visitors))}</span></p><p style="margin:0;font-size:14px;line-height:1.5;color:#1d1d1f">${escapeHtml(parts.slice(1).join(" · "))}</p></div>`
    }

    // Nothing happened on any site: no email this week
    if (lines.length === 0) continue

    const ok = await sendEmail({
      to: owner.email,
      subject: `Your week: ${total.toLocaleString("en")} in the house`,
      lines: ["Here is how the past seven days went.", ...lines],
      html: blocks,
      button: { label: "Open your dashboard", url: appUrl("/dashboard") },
      footer: `You get this once a week. <a href="${escapeHtml(unsubscribeUrl(owner.id))}" style="color:#6e6e73">Stop these emails</a>.`,
    })
    if (ok) sent++
  }

  return sent
}
