import { fileURLToPath, URL } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    // Separate processes exercise local dates in both Korea and a DST timezone.
    pool: "forks",
    projects: [
      { extends: true, test: { name: "ui", include: ["src/**/*.test.tsx"] } },
      {
        extends: true,
        test: {
          name: "domain",
          environment: "node",
          setupFiles: [],
          include: ["src/**/*.test.ts"],
          exclude: ["src/utils/dates.test.ts"],
        },
      },
      ...["Asia/Seoul", "America/New_York"].map((timezone) => ({
        extends: true as const,
        test: {
          name: timezone,
          environment: "node" as const,
          setupFiles: [],
          include: ["src/utils/dates.test.ts"],
          env: { TZ: timezone },
        },
      })),
    ],
  },
});
