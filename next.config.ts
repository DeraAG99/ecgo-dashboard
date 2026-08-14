import { defineConfig } from "next"

export default defineConfig({
  reactStrictMode: true,
  swcMinify: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    turbo: {
      rules: {
        "*.svg": {
          loaders: [],
          parsers: [],
        },
      },
    },
  },
})