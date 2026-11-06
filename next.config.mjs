/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  output: 'export',
  ...(isGitHubPages
    ? {
        // GitHub Pages serves this repository under /sd-calc.
        basePath: '/sd-calc',
        assetPrefix: '/sd-calc/',
      }
    : {}),
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  devIndicators: false,
  logging: { browserToTerminal: 'error' },
}
export default nextConfig
