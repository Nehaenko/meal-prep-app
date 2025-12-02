import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import crypto from "node:crypto";

// Ensure getRandomValues exists (Node 16 lacks it natively)
if (!crypto.getRandomValues) {
  crypto.getRandomValues = (typedArray) => {
    typedArray.set(crypto.randomBytes(typedArray.byteLength));
    return typedArray;
  };
}
if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
  globalThis.crypto = crypto.webcrypto ?? { getRandomValues: crypto.getRandomValues };
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /\.gql(\?import)?$/,
        replacement: fileURLToPath(
          new URL("./src/test-helpers/emptyGql.js", import.meta.url)
        ),
      },
    ],
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./setupTests.js",
  },
});
