import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.{ts,tsx}"],
    globals: false,
    css: false,
  },
  resolve: {
    alias: [
      {
        find: "@/factories",
        replacement: resolve(__dirname, "test/factories.ts"),
      },
      { find: /^@\/(.*)$/, replacement: resolve(__dirname, "src/$1") },
    ],
  },
});
