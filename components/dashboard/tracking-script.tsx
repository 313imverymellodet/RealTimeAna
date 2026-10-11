"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Copy, Code, FileCode, Globe, Zap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TrackingScriptProps {
  siteId: string
  domain: string
}

export function TrackingScript({ siteId, domain }: TrackingScriptProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const scriptCode = `<script defer data-site-id="${siteId}" data-api="${baseUrl}/api/track" src="${baseUrl}/tracker.js"></script>`

  const nextJsCode = `// app/layout.tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script 
          defer 
          data-site-id="${siteId}"
          data-api="${baseUrl}/api/track"
          src="${baseUrl}/tracker.js"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}`

  const handleCopy = (code: string, type: string) => {
    navigator.clipboard.writeText(code)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
              <Code className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-1">Install Tracking Script</h2>
              <p className="text-muted-foreground">
                Add this script to your website to start tracking visitors on <strong>{domain}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Tabs */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Choose your installation method</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="html" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="html" className="gap-2">
                <Globe className="h-4 w-4" />
                HTML
              </TabsTrigger>
              <TabsTrigger value="nextjs" className="gap-2">
                <FileCode className="h-4 w-4" />
                Next.js
              </TabsTrigger>
            </TabsList>

            <TabsContent value="html" className="space-y-4">
              <p className="text-sm text-muted-foreground">Add this snippet just before the closing {"</head>"} tag:</p>
              <div className="relative">
                <pre className="bg-zinc-950 text-zinc-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant={copied === "html" ? "default" : "secondary"}
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(scriptCode, "html")}
                >
                  {copied === "html" ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="nextjs" className="space-y-4">
              <p className="text-sm text-muted-foreground">Add this to your root layout file:</p>
              <div className="relative">
                <pre className="bg-zinc-950 text-zinc-50 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
                  <code>{nextJsCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant={copied === "nextjs" ? "default" : "secondary"}
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(nextJsCode, "nextjs")}
                >
                  {copied === "nextjs" ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-medium mb-1">Lightweight</h3>
            <p className="text-sm text-muted-foreground">Under 1KB gzipped. Won&apos;t slow down your site.</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center mb-3">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-medium mb-1">No Cookies</h3>
            <p className="text-sm text-muted-foreground">Privacy-friendly. No cookie banners needed.</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center mb-3">
              <Globe className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-medium mb-1">Real-time</h3>
            <p className="text-sm text-muted-foreground">See visitors appear instantly on your dashboard.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
