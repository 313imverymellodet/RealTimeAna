function slug(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
}

// Builds a tagged link for one post, so the dashboard can show what that post brought in
export function buildTrackedLink(domain: string, page: string, network: string, label: string) {
  let url: URL
  try {
    url = new URL(/^https?:\/\//.test(page) ? page : `https://${domain}${page.startsWith("/") ? page : `/${page}`}`)
  } catch {
    return ""
  }
  url.searchParams.set("utm_source", network)
  url.searchParams.set("utm_medium", network === "newsletter" ? "email" : "social")
  const campaign = slug(label)
  if (campaign) url.searchParams.set("utm_campaign", campaign)
  return url.toString()
}
