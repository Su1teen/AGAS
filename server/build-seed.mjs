import { build } from "esbuild";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
mkdirSync("server/.generated", { recursive: true });
await build({
  entryPoints: ["src/data/products.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "server/.generated/catalog.mjs",
  alias: { "@": "./src" },
  plugins: [
    {
      name: "assets",
      setup(b) {
        b.onLoad({ filter: /\.(png|jpe?g|webp)$/ }, () => ({
          contents: 'export default ""',
          loader: "js",
        }));
      },
    },
  ],
});
const { products } = await import(pathToFileURL(process.cwd() + "/server/.generated/catalog.mjs"));
writeFileSync(
  "server/catalog.seed.json",
  JSON.stringify(
    products.map((p) => ({
      id: p.id,
      sku: p.slug,
      name: p.name,
      description: p.description,
      category: p.categoryLabel,
      brand: p.brand,
      price_minor: Math.round(p.price * 100),
      stock: p.inStock ? 999 : 0,
      legacy: true,
    })),
    null,
    2,
  ) + "\n",
);
console.log("Catalog seed:", products.length);
