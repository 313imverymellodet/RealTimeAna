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
    default: "Housecount: live audience analytics for publishers and creators",
    template: "%s · Housecount",
  },
  description:
    "Know who's in the house. See how many people are reading right now, what brought them, and which stories and sources lead to subscribers. One script tag, no cookies.",
  openGraph: {
    type: "website",
    siteName: "Housecount",
    title: "Housecount: live audience analytics for publishers and creators",
    description: "See how many people are reading right now, what brought them, and which stories and sources lead to subscribers.",
  },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        <Toaster theme="light" />
      </body>
    </html>
  )
}
