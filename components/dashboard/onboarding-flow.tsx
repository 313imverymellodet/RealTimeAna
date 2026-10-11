"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Copy, ArrowRight, CheckCircle2, Code, BarChart3, Zap } from "lucide-react"

interface Site {
  id: string
  name: string
  domain: string
}

interface OnboardingFlowProps {
  site: Site
  onComplete: () => void
}

export function OnboardingFlow({ site, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1)
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const scriptCode = `<script defer data-site-id="${site.id}" data-api="${baseUrl}/api/track" src="${baseUrl}/tracker.js"></script>`

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${s <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {step === 1 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Site added successfully!</CardTitle>
              <CardDescription className="text-base">
                {site.name} ({site.domain}) is now ready for tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Code className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">One simple script</h3>
                    <p className="text-sm text-muted-foreground">Add a single line of code to start tracking</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Instant analytics</h3>
                    <p className="text-sm text-muted-foreground">See visitor data within seconds of installation</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Privacy-first</h3>
                    <p className="text-sm text-muted-foreground">No cookies, GDPR compliant, respect your users</p>
                  </div>
                </div>
              </div>
              <Button className="w-full mt-6" size="lg" onClick={() => setStep(2)}>
                Continue to setup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Install the tracking script</CardTitle>
              <CardDescription className="text-base">
                Copy and paste this script into your website&apos;s {"<head>"} tag
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="relative">
                <pre className="bg-zinc-950 text-zinc-50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  size="sm"
                  variant={copied ? "default" : "secondary"}
                  className="absolute top-2 right-2"
                  onClick={handleCopy}
                >
                  {copied ? (
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

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-900 mb-1">Where to add this?</h4>
                <p className="text-sm text-amber-800">
                  Place this script just before the closing {"</head>"} tag in your HTML. For Next.js, add it to your
                  layout.tsx or _document.tsx file.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-transparent" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(3)}>
                  I&apos;ve installed it
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
              <CardDescription className="text-base">
                Your analytics dashboard is ready. Visit your website to see the first data come in.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="bg-muted/50 rounded-lg p-6 text-center">
                <p className="text-muted-foreground mb-2">Tracking</p>
                <p className="text-2xl font-semibold">{site.domain}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Real-time visitor tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Core Web Vitals monitoring</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Geographic visitor insights</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Check className="h-5 w-5 text-green-600" />
                  <span>Page performance analytics</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={onComplete}>
                Go to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
