import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
     {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "excel-connect-app.vercel.app",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "t93g9w-8080.csb.app",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
  
