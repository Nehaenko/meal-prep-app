import { builtinEnvironments } from "vitest/runtime";

const baseJsdom = builtinEnvironments.jsdom;

function ensureHeaders(global) {
  if (typeof global.Headers !== "undefined") return;
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
  global.Headers = HeadersPolyfill;
}

function ensureRequest(global) {
  if (typeof global.Request !== "undefined") return;
  class RequestPolyfill {
    constructor(input, init = {}) {
      this.url = typeof input === "string" ? input : input?.url ?? "";
      this.method = init.method ?? "GET";
      this.headers = init.headers ?? new global.Headers();
      this.body = init.body;
      this.signal = init.signal;
    }
  }
  global.Request = RequestPolyfill;
}

function ensureResponse(global) {
  if (typeof global.Response !== "undefined") return;
  class ResponsePolyfill {
    constructor(body = null, init = {}) {
      this.body = body;
      this.status = init.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
      this.headers = init.headers ?? new global.Headers();
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
  global.Response = ResponsePolyfill;
}

function ensureFetch(global) {
  if (typeof global.fetch !== "undefined") return;
  global.fetch = async () => new global.Response();
}

function ensureFormData(global) {
  if (typeof global.FormData !== "undefined") return;
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
  global.FormData = FormDataPolyfill;
}

export default {
  ...baseJsdom,
  name: "jsdom-request-safe",
  async setup(global, options) {
    ensureHeaders(global);
    ensureRequest(global);
    ensureResponse(global);
    ensureFetch(global);
    ensureFormData(global);
    return baseJsdom.setup(global, options);
  },
};
