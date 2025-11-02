/** @type {import('next').NextConfig} */
const nextConfig = {
  // Reduce double effect invocations in dev which cause duplicate Supabase calls
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { 
    unoptimized: true,
    domains: ['supabase.co', 'localhost'], // Allow Supabase images
  },
};

module.exports = nextConfig;
