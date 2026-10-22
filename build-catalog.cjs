/**
 * build-catalog.cjs
 * ─────────────────────────────────────────────────────────────────
 * Parses DALI_Catalog_Import.csv and Airtable_Catalog_Import.csv,
 * checks each product slug against actual image files in src/assets/,
 * and generates src/data/csvProducts.ts containing ONLY products
 * whose images exist locally.
 *
 * Usage:  node build-catalog.cjs
 */

const fs = require("fs");
const path = require("path");

// ── CSV Parser — handles quoted fields with commas/newlines ─────
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n" || ch === "\r") {
        row.push(field);
        if (row.length > 1 || row[0].trim() !== "") rows.push(row);
        row = [];
        field = "";
        if (ch === "\r" && text[i + 1] === "\n") i++;
      } else {
        field += ch;
      }
    }
  }
  // flush last row
  row.push(field);
  if (row.length > 1 || row[0].trim() !== "") rows.push(row);
  return rows;
}

// ── Image Discovery ─────────────────────────────────────────────
const assetsDir = path.join(__dirname, "src", "assets");
const assetFiles = fs.readdirSync(assetsDir);

// Build lookup:  lowercase-stem  →  actual filename
const imageMap = new Map();
for (const file of assetFiles) {
  const ext = path.extname(file).toLowerCase();
  if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
    const stem = path.basename(file, path.extname(file));
    imageMap.set(stem.toLowerCase(), file);
  }
}

/**
 * Try to find an image for a given product slug.
 * Strategy:
 *   1. Direct match:  slug === lowercase(filename)
 *   2. Strip "sunricher-" prefix and retry
 */
function findImage(slug) {
  if (imageMap.has(slug)) return imageMap.get(slug);
  if (slug.startsWith("sunricher-")) {
    const stripped = slug.slice("sunricher-".length);
    if (imageMap.has(stripped)) return imageMap.get(stripped);
  }
  return null;
}

// ── Helpers ─────────────────────────────────────────────────────
function toVarName(slug) {
  return "csvImg_" + slug.replace(/[^a-zA-Z0-9]/g, "_");
}

function esc(str) {
  if (!str) return "";
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "");
}

function splitMulti(str) {
  if (!str) return [];
  // CSV uses " · " (with interpunct) as separator
  return str
    .split(/\s*·\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// ── Parse CSV Files ─────────────────────────────────────────────
const csvFiles = [
  path.join(__dirname, "src", "DALI_Catalog_Import.csv"),
  path.join(__dirname, "src", "Airtable_Catalog_Import.csv"),
];

const allProducts = [];
const seenSlugs = new Set();
let totalRows = 0;
let skippedNoImage = 0;

for (const csvPath of csvFiles) {
  const raw = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(raw);
  if (rows.length < 2) {
    console.warn(`  ⚠ Skipped ${csvPath}: no data rows`);
    continue;
  }

  const headers = rows[0].map((h) => h.trim());
  const ci = (name) => {
    const idx = headers.indexOf(name);
    if (idx < 0) console.warn(`  ⚠ Column "${name}" not found in ${path.basename(csvPath)}`);
    return idx;
  };

  const COL = {
    name: ci("Name"),
    slug: ci("Slug"),
    brand: ci("Brand"),
    group: ci("Group"),
    collection: ci("Collection"),
    tagline: ci("Tagline"),
    description: ci("Description"),
    catSlug: ci("Category Slug"),
    catLabel: ci("Category Label"),
    subSlug: ci("Subcategory Slug"),
    subLabel: ci("Subcategory Label"),
    price: ci("Price"),
    rating: ci("Rating"),
    reviews: ci("Reviews Count"),
    protocols: ci("Protocols"),
    functions: ci("Functions"),
    compat: ci("Compatibility"),
    featTitle: ci("Primary Feature Title"),
    featText: ci("Primary Feature Text"),
  };

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < 10) continue;
    totalRows++;

    const slug = (r[COL.slug] || "").trim();
    if (!slug || seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const imageFile = findImage(slug);
    if (!imageFile) {
      skippedNoImage++;
      continue;
    }

    let price = parseInt(r[COL.price] || "0", 10);
    if (!price || price <= 0) continue;

    let subscriptionPrice;

    // Apply special pricing logic based on the origin CSV file
    const filename = path.basename(csvPath);
    if (filename === "DALI_Catalog_Import.csv") {
      // DALI: retail +50%, subscription +25% of original subscription
      const originalRetail = price;
      price = Math.ceil((originalRetail * 1.5) / 100) * 100;
      subscriptionPrice = Math.ceil((originalRetail * 0.9 * 1.25) / 100) * 100;
    } else if (filename === "Airtable_Catalog_Import.csv") {
      // Airtable: retail unchanged, subscription -25% of original subscription
      const originalRetail = price;
      // price remains same
      subscriptionPrice = Math.ceil((originalRetail * 0.9 * 0.75) / 100) * 100;
    } else {
      subscriptionPrice = Math.ceil((price * 0.9) / 100) * 100;
    }

    allProducts.push({
      slug,
      name: (r[COL.name] || "").trim(),
      brand: (r[COL.brand] || "Sunricher").trim(),
      group: (r[COL.group] || "b2b").trim(),
      collection: (r[COL.collection] || "").trim(),
      tagline: (r[COL.tagline] || "").trim(),
      description: (r[COL.description] || "").trim(),
      category: (r[COL.catSlug] || "").trim(),
      categoryLabel: (r[COL.catLabel] || "").trim(),
      subcategory: (r[COL.subSlug] || "").trim(),
      subcategoryLabel: (r[COL.subLabel] || "").trim(),
      price,
      subscriptionPrice,
      rating: parseFloat(r[COL.rating] || "4.7"),
      reviewsCount: parseInt(r[COL.reviews] || "0", 10),
      protocols: splitMulti(r[COL.protocols] || ""),
      functions: splitMulti(r[COL.functions] || ""),
      compatibility: splitMulti(r[COL.compat] || ""),
      primaryFeature: (r[COL.featTitle] || "").trim(),
      featureText: (r[COL.featText] || "").trim(),
      imageFile,
      varName: toVarName(slug),
    });
  }
}

console.log("\n  ╭──────────────────────────────────────╮");
console.log("  │  build-catalog.cjs                   │");
console.log("  ├──────────────────────────────────────┤");
console.log(`  │  Total CSV rows:    ${String(totalRows).padStart(4)}              │`);
console.log(`  │  ✅ With images:    ${String(allProducts.length).padStart(4)}              │`);
console.log(`  │  ❌ No image:       ${String(skippedNoImage).padStart(4)}              │`);
console.log("  ╰──────────────────────────────────────╯\n");

// ── List matched products ───────────────────────────────────────
console.log("  Matched products:");
for (const p of allProducts) {
  console.log(`    • ${p.slug}  →  ${p.imageFile}`);
}
console.log("");

// ── Generate TypeScript output ──────────────────────────────────
let ts = "";
ts += "// ═══════════════════════════════════════════════════════════════\n";
ts += "// AUTO-GENERATED by build-catalog.cjs — DO NOT EDIT MANUALLY\n";
ts += `// Generated: ${new Date().toISOString()}\n`;
ts += `// Products: ${allProducts.length} (with verified local images)\n`;
ts += "// ═══════════════════════════════════════════════════════════════\n\n";

// Static image imports
for (const p of allProducts) {
  ts += `import ${p.varName} from "@/assets/${p.imageFile}";\n`;
}

ts += '\nimport type { ProductSeed } from "./products";\n\n';

// Product seeds array
ts += "export const csvProductSeeds: ProductSeed[] = [\n";

for (const p of allProducts) {
  ts += "  {\n";
  ts += `    slug: "${esc(p.slug)}",\n`;
  ts += `    name: "${esc(p.name)}",\n`;
  ts += `    brand: "${esc(p.brand)}",\n`;
  ts += `    group: "${esc(p.group)}" as const,\n`;
  ts += `    collection: "${esc(p.collection)}",\n`;
  ts += `    tagline: "${esc(p.tagline)}",\n`;
  ts += `    description: "${esc(p.description)}",\n`;
  ts += `    category: "${esc(p.category)}",\n`;
  ts += `    categoryLabel: "${esc(p.categoryLabel)}",\n`;
  ts += `    subcategory: "${esc(p.subcategory)}",\n`;
  ts += `    subcategoryLabel: "${esc(p.subcategoryLabel)}",\n`;
  ts += `    price: ${p.price},\n`;
  ts += `    subscriptionPrice: ${p.subscriptionPrice},\n`;
  ts += `    rating: ${p.rating},\n`;
  ts += `    reviewsCount: ${p.reviewsCount},\n`;
  ts += `    image: ${p.varName},\n`;
  ts += `    protocols: [${p.protocols.map((s) => `"${esc(s)}"`).join(", ")}],\n`;
  ts += `    functions: [${p.functions.map((s) => `"${esc(s)}"`).join(", ")}],\n`;
  ts += `    compatibility: [${p.compatibility.map((s) => `"${esc(s)}"`).join(", ")}],\n`;
  ts += `    sourceUrl: "https://www.sunricher.com",\n`;
  ts += `    primaryFeature: "${esc(p.primaryFeature)}",\n`;
  ts += `    featureText: "${esc(p.featureText)}",\n`;
  ts += "  },\n";
}

ts += "];\n";

// Write output
const outPath = path.join(__dirname, "src", "data", "csvProducts.ts");
fs.writeFileSync(outPath, ts, "utf8");
console.log(`  📝 Written: src/data/csvProducts.ts`);
console.log(`  🏗  Run \`npm run dev\` to see the new catalog.\n`);
