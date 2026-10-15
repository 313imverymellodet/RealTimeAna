import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${path.resolve(__dirname)}/` },
      // Next.js guards server modules with this package; outside Next it is a no-op
      { find: "server-only", replacement: path.resolve(__dirname, "tests/server-only.ts") },
    ],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Integration tests share one in-memory database per file
    fileParallelism: false,
  },
})
