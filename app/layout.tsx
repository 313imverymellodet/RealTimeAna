import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Pulse: live web analytics without cookies",
    template: "%s · Pulse",
  },
  description:
    "See who is on your site right now. Live web analytics with one script tag, no cookies and nothing stored in your visitors' browsers.",
  openGraph: {
    type: "website",
    siteName: "Pulse",
    title: "Pulse: live web analytics without cookies",
    description: "See who is on your site right now. One script tag, no cookies.",
  },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  colorScheme: "dark",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster theme="dark" />
      </body>
    </html>
  )
}
