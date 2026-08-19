import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "app/api/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/",
        ".next/",
        "drizzle/",
        "**/*.d.ts",
        "**/export/**",
        "lib/test-utils.ts",
        "lib/db/index.ts",
        "lib/db/schema.ts",
        "lib/alerts/index.ts",
        "lib/checkin/index.ts",
        "lib/maintenance/index.ts",
        "lib/time/index.ts",
        "lib/validation/index.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
})