import { ImageResponse } from "next/og"

export const alt = "Housecount: know who's in the house"
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
          Housecount
        </div>
        <div style={{ marginTop: 40, fontSize: 84, fontWeight: 600, letterSpacing: -3, lineHeight: 1.05 }}>
          Know who&apos;s in the house.
        </div>
        <div style={{ marginTop: 28, fontSize: 34, color: "#6e6e73" }}>
          Live audience analytics for publishers and creators.
        </div>
      </div>
    ),
    size,
  )
}
