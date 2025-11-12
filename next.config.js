/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',   <-- remove this
  trailingSlash: true,     // optional; can keep
  images: { unoptimized: true }, // fine to keep
};
module.exports = nextConfig;
