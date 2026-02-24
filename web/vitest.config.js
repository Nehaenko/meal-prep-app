import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import crypto from "node:crypto";

// Node 16 lacks Array.prototype.findLastIndex
if (!Array.prototype.findLastIndex) {
  Object.defineProperty(Array.prototype, "findLastIndex", {
    value(predicate, thisArg) {
      for (let i = this.length - 1; i >= 0; i--) {
        if (predicate.call(thisArg, this[i], i, this)) return i;
      }
      return -1;
    },
  });
}

// Vitest's jsdom environment expects Request/Response/etc. to exist.
// Node 16 doesn't provide them, so we polyfill the minimal pieces we need
// before the environment spins up.
if (typeof globalThis.Headers === "undefined") {
  class HeadersPolyfill {
    constructor(init = {}) {
      this.map = new Map(Array.isArray(init) ? init : Object.entries(init));
    }
    append(name, value) {
      this.map.set(name.toLowerCase(), value);
    }
    get(name) {
      return this.map.get(name.toLowerCase()) ?? null;
    }
    has(name) {
      return this.map.has(name.toLowerCase());
    }
  }
  globalThis.Headers = HeadersPolyfill;
}

if (typeof globalThis.Request === "undefined") {
  class RequestPolyfill {
    constructor(input, init = {}) {
      this.url = typeof input === "string" ? input : input?.url ?? "";
      this.method = init.method ?? "GET";
      this.headers = init.headers ?? new globalThis.Headers();
      this.body = init.body;
      this.signal = init.signal;
    }
  }
  globalThis.Request = RequestPolyfill;
}

if (typeof globalThis.Response === "undefined") {
  class ResponsePolyfill {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = init.headers ?? new globalThis.Headers();
    }
    async json() {
      if (typeof this.body === "string") return JSON.parse(this.body);
      return this.body;
    }
    async text() {
      if (typeof this.body === "string") return this.body;
      return typeof this.body === "undefined" ? "" : String(this.body);
    }
  }
  globalThis.Response = ResponsePolyfill;
}

if (typeof globalThis.fetch === "undefined") {
  globalThis.fetch = async () => new globalThis.Response();
}

if (typeof globalThis.FormData === "undefined") {
  class FormDataPolyfill {
    constructor() {
      this.fields = [];
    }
    append(key, value) {
      this.fields.push([key, value]);
    }
    forEach(callback) {
      this.fields.forEach(([key, value]) => callback(value, key));
    }
  }
  globalThis.FormData = FormDataPolyfill;
}

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
    environment: "./src/test-helpers/jsdom-request-env.js",
    globals: true,
    setupFiles: "./setupTests.js",
    threads: false,
  },
});
