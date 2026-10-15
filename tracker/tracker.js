;(() => {
  var script = document.currentScript
  var siteId = script && script.getAttribute("data-site-id")
  var endpoint = (script && script.getAttribute("data-api")) || (script && new URL("/api/track", script.src).href)

  if (!siteId || !endpoint) {
    console.error("Housecount: missing data-site-id on the tracking script")
    return
  }

  // Respect explicit opt-outs. Nothing is ever written to cookies or browser storage.
  if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return
  if (/^(localhost|127\.|\[::1\])/.test(location.hostname) || location.protocol === "file:") return

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID()
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      var r = (Math.random() * 16) | 0
      return (c === "x" ? r : (r & 3) | 8).toString(16)
    })
  }

  // Id for the current page view only. Held in memory and gone on reload.
  var viewId, viewPath, visibleSince, visibleMs, maxDepth

  function send(data) {
    data.siteId = siteId
    var payload = JSON.stringify(data)
    // text/plain avoids a CORS preflight request before every event
    if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([payload], { type: "text/plain" }))) return
    fetch(endpoint, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(
      () => {},
    )
  }

  function pageview() {
    var params = new URLSearchParams(location.search)
    viewId = uuid()
    viewPath = location.pathname
    visibleMs = 0
    maxDepth = 0
    measureDepth()
    visibleSince = document.visibilityState === "visible" ? Date.now() : null
    send({
      type: "pageview",
      id: viewId,
      path: viewPath,
      referrer: document.referrer || null,
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      // ?ref=name is a short way to name the post or partner a link came from
      utmCampaign: params.get("utm_campaign") || params.get("ref"),
    })
  }

  // Furthest point reached, as a percentage of the page's height
  function measureDepth() {
    var page = document.documentElement
    var height = Math.max(page.scrollHeight, document.body ? document.body.scrollHeight : 0)
    if (!height) return
    var seen = Math.min(100, Math.round(((window.scrollY || page.scrollTop) + window.innerHeight) / height * 100))
    if (seen > maxDepth) maxDepth = seen
  }
  var depthQueued
  window.addEventListener(
    "scroll",
    () => {
      if (depthQueued) return
      depthQueued = true
      requestAnimationFrame(() => {
        depthQueued = false
        measureDepth()
      })
    },
    { passive: true },
  )

  // Report time the page was actually visible, and how far down it the reader got
  function flush() {
    if (!viewId) return
    if (visibleSince) {
      visibleMs += Date.now() - visibleSince
      visibleSince = null
    }
    measureDepth()
    send({ type: "duration", id: viewId, path: viewPath, duration: Math.round(visibleMs / 1000), depth: maxDepth })
  }

  function navigated() {
    if (location.pathname === viewPath) return
    flush()
    pageview()
  }

  // Goals: housecount("signup") or housecount("purchase", { revenue: 49 })
  function goal(name, props) {
    send({ type: "event", name: String(name), path: location.pathname, revenue: props && props.revenue })
  }
  // Signed-in users: housecount.identify("user_123") on each page load while logged in.
  // Lets funnels and journeys follow one person across days. Nothing is stored in the browser.
  var identified
  goal.identify = function (userId) {
    if (!userId || identified === String(userId)) return
    identified = String(userId)
    send({ type: "identify", userId: identified, path: location.pathname })
  }
  // `pulse` is the former name, kept so existing installs keep working
  window.housecount = window.pulse = goal

  // Or with no code: <button data-housecount-goal="signup" data-housecount-revenue="49">
  document.addEventListener(
    "click",
    (event) => {
      var el =
        event.target && event.target.closest && event.target.closest("[data-housecount-goal],[data-pulse-goal]")
      if (!el) return
      var attr = (name) => el.getAttribute("data-housecount-" + name) || el.getAttribute("data-pulse-" + name)
      goal(attr("goal"), { revenue: Number(attr("revenue")) || 0 })
    },
    true,
  )

  // Single-page apps: treat history navigation as a new page view
  var pushState = history.pushState
  history.pushState = function () {
    pushState.apply(this, arguments)
    navigated()
  }
  window.addEventListener("popstate", navigated)

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush()
    else visibleSince = Date.now()
  })
  window.addEventListener("pagehide", flush)

  pageview()
})()
