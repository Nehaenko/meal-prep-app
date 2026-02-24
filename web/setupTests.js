import "@testing-library/jest-dom";

// Node 16 polyfills
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
