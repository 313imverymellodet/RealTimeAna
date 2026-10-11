import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { getPlanLimits } from "@/lib/pricing"

// Use service role key for public tracking endpoint (bypasses RLS)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

// Simple geo lookup using request headers (Vercel provides these)
function getGeoData(request: NextRequest) {
  return {
    country: request.headers.get("x-vercel-ip-country") || null,
    city: request.headers.get("x-vercel-ip-city") || null,
    latitude: request.headers.get("x-vercel-ip-latitude")
      ? Number.parseFloat(request.headers.get("x-vercel-ip-latitude")!)
      : null,
    longitude: request.headers.get("x-vercel-ip-longitude")
      ? Number.parseFloat(request.headers.get("x-vercel-ip-longitude")!)
      : null,
  }
}

// Parse user agent for device/browser/os info
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase()

  let device = "desktop"
  if (/mobile|android|iphone|ipad|tablet/i.test(ua)) {
    device = /tablet|ipad/i.test(ua) ? "tablet" : "mobile"
  }

  let browser = "other"
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome"
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari"
  else if (ua.includes("firefox")) browser = "Firefox"
  else if (ua.includes("edg")) browser = "Edge"

  let os = "other"
  if (ua.includes("windows")) os = "Windows"
  else if (ua.includes("mac")) os = "macOS"
  else if (ua.includes("linux")) os = "Linux"
  else if (ua.includes("android")) os = "Android"
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS"

  return { device, browser, os }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      type,
      siteId,
      visitorId,
      sessionId,
      path,
      referrer,
      screenWidth,
      screenHeight,
      userAgent,
      duration,
      webVitals,
    } = body

    if (!siteId || !visitorId || !sessionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders() })
    }

    // Verify site exists and get user info
    const { data: site } = await supabase
      .from("sites")
      .select("id, user_id")
      .eq("id", siteId)
      .single()

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404, headers: corsHeaders() })
    }

    // Check plan limits
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, pageviews_this_month")
      .eq("user_id", site.user_id)
      .single()

    if (profile) {
      const { pageviewLimit } = getPlanLimits(profile.plan || "free")
      if (profile.pageviews_this_month >= pageviewLimit) {
        // Plan limit exceeded - drop tracking (silently for production)
        return NextResponse.json({ success: false, reason: "plan_limit_exceeded" }, { headers: corsHeaders() })
      }
    }

    const geo = getGeoData(request)
    const deviceInfo = parseUserAgent(userAgent || "")

    if (type === "pageview") {
      // Insert page view
      const { error: pvError } = await supabase.from("page_views").insert({
        site_id: siteId,
        visitor_id: visitorId,
        session_id: sessionId,
        path: path,
        referrer: referrer,
        country: geo.country,
        city: geo.city,
        latitude: geo.latitude,
        longitude: geo.longitude,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        screen_width: screenWidth,
        screen_height: screenHeight,
      })

      if (pvError) {
        console.error("Page view insert error:", pvError)
      }

      // Check if session exists
      const { data: existingSession } = await supabase
        .from("sessions")
        .select("id, page_count")
        .eq("session_id", sessionId)
        .single()

      if (existingSession) {
        // Update existing session
        await supabase
          .from("sessions")
          .update({
            page_count: existingSession.page_count + 1,
            bounced: false,
          })
          .eq("session_id", sessionId)
      } else {
        // Create new session
        const { error: sessionError } = await supabase.from("sessions").insert({
          site_id: siteId,
          visitor_id: visitorId,
          session_id: sessionId,
          page_count: 1,
          bounced: true,
        })

        if (sessionError) {
          console.error("Session insert error:", sessionError)
        }

        // Increment user's pageview counter for the month
        if (profile) {
          await supabase
            .from("profiles")
            .update({
              pageviews_this_month: (profile.pageviews_this_month || 0) + 1,
            })
            .eq("user_id", site.user_id)
        }
      }
    } else if (type === "duration") {
      // Update page view with duration and web vitals
      await supabase
        .from("page_views")
        .update({
          duration: duration,
          lcp: webVitals?.lcp,
          fcp: webVitals?.fcp,
          cls: webVitals?.cls,
          inp: webVitals?.inp,
          ttfb: webVitals?.ttfb,
        })
        .eq("session_id", sessionId)
        .eq("path", path)
        .order("created_at", { ascending: false })
        .limit(1)

      // Update session end time
      await supabase.from("sessions").update({ ended_at: new Date().toISOString() }).eq("session_id", sessionId)
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders() })
  } catch (error) {
    console.error("Tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders() })
  }
}

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders(),
  })
}
