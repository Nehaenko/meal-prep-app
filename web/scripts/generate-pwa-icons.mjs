import fs from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const root = process.cwd();
const svgPath = path.join(root, "public", "meal-prep-logo.svg");
const outDir = path.join(root, "public", "icons");

const svg = await fs.readFile(svgPath, "utf8");

const inner = svg
  .replace(/^<svg[^>]*>/, "")
  .replace(/<\/svg>\s*$/, "");

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#ffffff" /><g transform="translate(51.2 51.2) scale(0.8)">${inner}</g></svg>`;

const renderPng = (svgString, size) => {
  const resvg = new Resvg(svgString, {
    fitTo: { mode: "width", value: size },
  });
  return resvg.render().asPng();
};

await fs.mkdir(outDir, { recursive: true });

await fs.writeFile(path.join(outDir, "icon-192.png"), renderPng(svg, 192));
await fs.writeFile(path.join(outDir, "icon-512.png"), renderPng(svg, 512));
await fs.writeFile(
  path.join(outDir, "icon-512-maskable.png"),
  renderPng(maskableSvg, 512)
);

console.log("PWA icons generated in public/icons");
