import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  images: {
    // Bypass Next.js image optimization to avoid SSRF private-IP false-positive
    // on Supabase's IPv6 NAT64 addresses (64:ff9b::...)
    unoptimized: true,
  },
};

export default withPWA({
  dest: "public",
  register: true,
  sw: "sw.js",
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
  },
})(nextConfig);
