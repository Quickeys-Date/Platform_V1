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
  // A production build must never overwrite assets used by a running dev server.
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next-build',
})
