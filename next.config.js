const { PHASE_DEVELOPMENT_SERVER } = require('next/constants')

/** @type {import('next').NextConfig} */
const sharedConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
}

module.exports = phase => ({
  ...sharedConfig,
  // Vercel requires the standard .next routes manifest. Local development and
  // local production checks stay isolated from existing review artifacts.
  distDir: process.env.VERCEL
    ? '.next'
    : phase === PHASE_DEVELOPMENT_SERVER
      ? '.next-dev'
      : '.next-build',
})
