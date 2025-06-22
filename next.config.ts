import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // For CDK deployment (static export) - disable for Amplify SSR
  // output: 'export',
  // trailingSlash: true,
  // images: {
  //   unoptimized: true
  // },

  // ESLint configuration for builds
  eslint: {
    // Only run ESLint on specific directories during build
    dirs: ['app', 'components', 'lib'],
    // Don't fail build on ESLint warnings, only errors
    ignoreDuringBuilds: false
  },

  // TypeScript configuration
  typescript: {
    // Don't fail build on TypeScript errors in development
    ignoreBuildErrors: false
  },

  env: {
    // Make environment variables available on the client side
    MS_CORE_CREATOR_STUDIO: process.env.MS_CORE_CREATOR_STUDIO
  }
}

export default nextConfig
