import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    // Make environment variables available on the client side
    MS_CORE_CREATOR_STUDIO: process.env.MS_CORE_CREATOR_STUDIO
  }
}

export default nextConfig
