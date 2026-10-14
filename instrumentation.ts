// Runs once when the server starts. Checks hourly whether the weekly summary
// emails are due; the job itself decides and makes sure nobody is emailed twice.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || !process.env.DATABASE_URL) return

  const run = async () => {
    try {
      const { sendWeeklySummaries } = await import("@/lib/weekly-summary")
      const sent = await sendWeeklySummaries()
      if (sent > 0) console.log(`Weekly summaries sent: ${sent}`)
    } catch (error) {
      console.error("Weekly summary job failed:", error)
    }
  }

  setTimeout(run, 60_000)
  setInterval(run, 60 * 60_000)
}
