;(() => {
  var script = document.currentScript
  var siteId = script && script.getAttribute("data-site-id")
  var endpoint = (script && script.getAttribute("data-api")) || (script && new URL("/api/track", script.src).href)

  if (!siteId || !endpoint) {
    console.error("Pulse: missing data-site-id on the tracking script")
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
  var viewId, viewPath, visibleSince, visibleMs

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
    visibleSince = document.visibilityState === "visible" ? Date.now() : null
    send({
      type: "pageview",
      id: viewId,
      path: viewPath,
      referrer: document.referrer || null,
      utmSource: params.get("utm_source") || params.get("ref") || null,
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    })
  }

  // Report time the page was actually visible
  function flush() {
    if (!viewId) return
    if (visibleSince) {
      visibleMs += Date.now() - visibleSince
      visibleSince = null
    }
    send({ type: "duration", id: viewId, path: viewPath, duration: Math.round(visibleMs / 1000) })
  }

  function navigated() {
    if (location.pathname === viewPath) return
    flush()
    pageview()
  }

  // Goals: pulse("signup") or pulse("purchase", { revenue: 49 })
  function goal(name, props) {
    send({ type: "event", name: String(name), path: location.pathname, revenue: props && props.revenue })
  }
  // Signed-in users: pulse.identify("user_123") on each page load while logged in.
  // Lets funnels and journeys follow one person across days. Nothing is stored in the browser.
  var identified
  goal.identify = function (userId) {
    if (!userId || identified === String(userId)) return
    identified = String(userId)
    send({ type: "identify", userId: identified, path: location.pathname })
  }
  window.pulse = goal

  // Or with no code: <button data-pulse-goal="signup" data-pulse-revenue="49">
  document.addEventListener(
    "click",
    (event) => {
      var el = event.target && event.target.closest && event.target.closest("[data-pulse-goal]")
      if (el) goal(el.getAttribute("data-pulse-goal"), { revenue: Number(el.getAttribute("data-pulse-revenue")) || 0 })
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
