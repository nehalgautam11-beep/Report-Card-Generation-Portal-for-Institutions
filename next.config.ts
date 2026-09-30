import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "adm-zip"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

