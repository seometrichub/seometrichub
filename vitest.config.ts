import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: "server-only",
        replacement: fileURLToPath(
          new URL("./test/server-only-mock.ts", import.meta.url)
        ),
      },
      {
        find: /^@\//,
        replacement: fileURLToPath(
          new URL("./", import.meta.url)
        ),
      },
    ],
  },
  test: {
    environment: "node",
  },
});
