/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Removed for API routes support
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig