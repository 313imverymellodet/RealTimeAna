;(() => {
  var script = document.currentScript
  var siteId = script?.getAttribute("data-site-id")
  var apiEndpoint = script?.getAttribute("data-api")

  if (!siteId) {
    console.error("Analytics: Missing data-site-id attribute")
    return
  }

  if (!apiEndpoint) {
    console.error("Analytics: Missing data-api attribute")
    return
  }

  // Generate visitor ID (stored in localStorage for returning visitors)
  function getVisitorId() {
    var visitorId = null
    try {
      visitorId = localStorage.getItem("_vid")
      if (!visitorId) {
        visitorId = "v_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
        localStorage.setItem("_vid", visitorId)
      }
    } catch (e) {
      visitorId = "v_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    }
    return visitorId
  }

  // Generate session ID (stored in sessionStorage)
  function getSessionId() {
    var sessionId = null
    try {
      sessionId = sessionStorage.getItem("_sid")
      if (!sessionId) {
        sessionId = "s_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
        sessionStorage.setItem("_sid", sessionId)
      }
    } catch (e) {
      sessionId = "s_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    }
    return sessionId
  }

  var visitorId = getVisitorId()
  var sessionId = getSessionId()
  var pageEntryTime = Date.now()
  var currentPath = window.location.pathname

  // Core Web Vitals
  var webVitals = {
    lcp: null,
    fcp: null,
    cls: null,
    inp: null,
    ttfb: null,
  }

  // Send data to API
  function sendData(data) {
    var payload = JSON.stringify(data)

    // Try sendBeacon first (works on page unload)
    if (navigator.sendBeacon) {
      var blob = new Blob([payload], { type: "application/json" })
      var sent = navigator.sendBeacon(apiEndpoint, blob)
      if (sent) return
    }

    // Fallback to fetch
    fetch(apiEndpoint, {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      mode: "cors",
    }).catch(() => {})
  }

  // Track page view
  function trackPageView() {
    sendData({
      type: "pageview",
      siteId: siteId,
      visitorId: visitorId,
      sessionId: sessionId,
      path: window.location.pathname,
      referrer: document.referrer || null,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    })
  }

  // Track page duration on leave
  function trackPageDuration() {
    var duration = Math.round((Date.now() - pageEntryTime) / 1000)

    sendData({
      type: "duration",
      siteId: siteId,
      visitorId: visitorId,
      sessionId: sessionId,
      path: currentPath,
      duration: duration,
      webVitals: webVitals,
    })
  }

  // Observe Core Web Vitals
  function observeWebVitals() {
    if (!window.PerformanceObserver) return

    try {
      // LCP
      new PerformanceObserver((list) => {
        var entries = list.getEntries()
        var lastEntry = entries[entries.length - 1]
        if (lastEntry) webVitals.lcp = lastEntry.startTime
      }).observe({ type: "largest-contentful-paint", buffered: true })
    } catch (e) {}

    try {
      // FCP
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.name === "first-contentful-paint") {
            webVitals.fcp = entry.startTime
          }
        })
      }).observe({ type: "paint", buffered: true })
    } catch (e) {}

    try {
      // CLS
      var clsValue = 0
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value
            webVitals.cls = clsValue
          }
        })
      }).observe({ type: "layout-shift", buffered: true })
    } catch (e) {}

    try {
      // INP
      new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.interactionId) {
            var inp = entry.duration
            if (!webVitals.inp || inp > webVitals.inp) {
              webVitals.inp = inp
            }
          }
        })
      }).observe({ type: "event", buffered: true })
    } catch (e) {}

    // TTFB
    try {
      if (window.performance && window.performance.timing) {
        var timing = window.performance.timing
        webVitals.ttfb = timing.responseStart - timing.requestStart
      }
    } catch (e) {}
  }

  // Handle SPA navigation
  function handleNavigation() {
    var originalPushState = history.pushState
    var originalReplaceState = history.replaceState

    history.pushState = function () {
      trackPageDuration()
      originalPushState.apply(this, arguments)
      pageEntryTime = Date.now()
      currentPath = window.location.pathname
      trackPageView()
    }

    history.replaceState = function () {
      originalReplaceState.apply(this, arguments)
    }

    window.addEventListener("popstate", () => {
      trackPageDuration()
      pageEntryTime = Date.now()
      currentPath = window.location.pathname
      trackPageView()
    })
  }

  // Initialize
  observeWebVitals()
  trackPageView()
  handleNavigation()

  // Track duration on page unload
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      trackPageDuration()
    }
  })

  window.addEventListener("pagehide", trackPageDuration)
})()
