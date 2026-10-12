import { ImageResponse } from "next/og"
import { CHANNELS, channelColor } from "@/lib/channels"
import { getSharedSite } from "@/lib/sites"
import { getStats } from "@/lib/stats"

// The weekly "house card": an image of a site's week, for owners to post.
// Only available while the site's public link is switched on.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const site = await getSharedSite((await params).token)
  if (!site) return new Response("Not found", { status: 404 })

  const stats = await getStats(site.id, "7d", "UTC")
  const readers = stats.totals.visitors.toLocaleString("en")
  const topPage = stats.pages[0]?.label
  const topStory = topPage === "/" ? "Front page" : topPage
  const record = stats.record
  const recordDay = record
    ? new Date(`${record.day}T12:00:00Z`).toLocaleDateString("en", { month: "short", day: "numeric", timeZone: "UTC" })
    : ""
  const total = stats.channels.reduce((sum, row) => sum + row.visitors, 0)
  const channels = CHANNELS.map((name) => ({
    name,
    share: total > 0 ? (stats.channels.find((row) => row.label === name)?.visitors ?? 0) / total : 0,
  })).filter((channel) => channel.share > 0)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          color: "#1d1d1f",
          padding: "56px 72px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30 }}>
          <div style={{ display: "flex", fontWeight: 600 }}>{site.domain}</div>
          <div style={{ display: "flex", color: "#9a5b00", fontSize: 22, letterSpacing: 4 }}>THIS WEEK</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 30 }}>
          <div style={{ display: "flex", fontSize: 150, fontWeight: 700, letterSpacing: -5, lineHeight: 1 }}>{readers}</div>
          <div style={{ display: "flex", fontSize: 40, color: "#6e6e73", marginTop: 8 }}>in the house</div>
        </div>

        <div style={{ display: "flex", height: 18, marginTop: 30, borderRadius: 9, overflow: "hidden", background: "#f5f5f7" }}>
          {channels.map((channel) => (
            <div
              key={channel.name}
              style={{ display: "flex", width: `${channel.share * 100}%`, background: channelColor(channel.name) }}
            />
          ))}
        </div>
        <div style={{ display: "flex", marginTop: 14, fontSize: 22, color: "#6e6e73" }}>
          {channels.map((channel) => (
            <div key={channel.name} style={{ display: "flex", alignItems: "center", marginRight: 28 }}>
              <div
                style={{
                  display: "flex",
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  marginRight: 8,
                  background: channelColor(channel.name),
                }}
              />
              {`${channel.name} ${Math.round(channel.share * 100)}%`}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 34, fontSize: 26 }}>
          {topStory ? (
            <div style={{ display: "flex" }}>
              <div style={{ display: "flex", color: "#6e6e73", marginRight: 12 }}>Top story</div>
              <div style={{ display: "flex" }}>{topStory.length > 52 ? `${topStory.slice(0, 52)}…` : topStory}</div>
            </div>
          ) : null}
          {record ? (
            <div style={{ display: "flex", marginTop: 8 }}>
              <div style={{ display: "flex", color: "#6e6e73", marginRight: 12 }}>House record</div>
              <div style={{ display: "flex" }}>{`${record.visitors.toLocaleString("en")} readers on ${recordDay}`}</div>
            </div>
          ) : null}
          <div style={{ display: "flex", alignItems: "center", marginTop: 26, fontSize: 24, fontWeight: 600 }}>
            <div style={{ display: "flex", width: 16, height: 16, borderRadius: 8, background: "#f5a623", marginRight: 10 }} />
            housecount
            <div style={{ display: "flex", color: "#6e6e73", fontWeight: 400, marginLeft: 14 }}>Know who&apos;s in the house.</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=600" } },
  )
}
