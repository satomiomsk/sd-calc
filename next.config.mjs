/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  devIndicators: false,
  logging: { browserToTerminal: 'error' },
}
export default nextConfig
