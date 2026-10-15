// Runs once when the server starts. Every hour it checks whether the weekly
// summary emails are due (the job makes sure nobody is emailed twice) and
// records follower counts for connected social accounts.
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
    // Daily follower counts for connected social accounts
    try {
      const { snapshotAllAccounts } = await import("@/lib/social")
      await snapshotAllAccounts()
    } catch (error) {
      console.error("Social snapshot job failed:", error)
    }
  }

  setTimeout(run, 60_000)
  setInterval(run, 60 * 60_000)
}
