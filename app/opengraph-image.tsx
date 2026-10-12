import { ImageResponse } from "next/og"

export const alt = "Pulse: live web analytics without cookies"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "#ffffff",
          color: "#1d1d1f",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 600 }}>
          <div style={{ width: 20, height: 20, borderRadius: 20, background: "#0071e3" }} />
          Pulse
        </div>
        <div style={{ marginTop: 40, fontSize: 84, fontWeight: 600, letterSpacing: -3, lineHeight: 1.05 }}>
          See who&apos;s on your site right now
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: "#6e6e73" }}>
          Live web analytics. One script tag. No cookies.
        </div>
      </div>
    ),
    size,
  )
}
