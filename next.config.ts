import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Bypass Next.js image optimization to avoid SSRF private-IP false-positive
    // on Supabase's IPv6 NAT64 addresses (64:ff9b::...)
    unoptimized: true,
  },
};

export default nextConfig;
