/** @type {import('next').NextConfig} */
const nextConfig = {
  // geoip-lite reads its data files from disk at runtime, so it must not be bundled
  serverExternalPackages: ["geoip-lite"],
}

export default nextConfig
