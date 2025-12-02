const nodeCrypto = require("crypto");

// Provide getRandomValues for environments where crypto lacks it (e.g., Node 16)
const ensureGetRandomValues = () => (typedArray) => {
  const buffer = nodeCrypto.randomBytes(typedArray.byteLength);
  typedArray.set(buffer);
  return typedArray;
};

if (typeof nodeCrypto.getRandomValues !== "function") {
  nodeCrypto.getRandomValues = ensureGetRandomValues();
}

if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
  const webcrypto =
    nodeCrypto.webcrypto ||
    ({
      getRandomValues: ensureGetRandomValues(),
    });
  globalThis.crypto = webcrypto;
}
