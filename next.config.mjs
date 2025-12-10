/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Moved from experimental.serverComponentsExternalPackages in Next.js 16
  serverExternalPackages: ['sharp', 'onnxruntime-node'],
  // Turbopack config (Next.js 16 uses Turbopack by default)
  turbopack: {},
}

export default nextConfig
