/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === 'true'

const nextConfig = {
  output: 'export',
  // This repository is the account's root GitHub Pages site.
  ...(isGitHubPages ? {} : {}),
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  devIndicators: false,
  logging: { browserToTerminal: 'error' },
}
export default nextConfig
