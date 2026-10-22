import { build } from "esbuild";
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { resolve } from "node:path";
const directory = resolve("dist/server");

await build({
  entryPoints: ["worker/platform.mjs"],
  outfile: `${directory}/platform.mjs`,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "es2022",
  minify: true,
  define: { "import.meta.url": JSON.stringify("file:///agas/platform.mjs") },
  loader: { ".sql": "text", ".ttf": "binary" },
  external: ["cloudflare:workers", "cloudflare:node"],
  alias: { "node:sqlite": resolve("worker/node-sqlite.mjs") },
  banner: {
    js: 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire("file:///agas/platform.mjs");',
  },
});
if (
  !readFileSync(`${directory}/index.mjs`, "utf8").includes('import frontend from "./frontend.mjs"')
)
  renameSync(`${directory}/index.mjs`, `${directory}/frontend.mjs`);
writeFileSync(
  `${directory}/index.mjs`,
  `import frontend from "./frontend.mjs";
import { platformRequest } from "./platform.mjs";
export { PlatformStore } from "./platform.mjs";
export default {
  fetch(request, env, ctx) {
    if (new URL(request.url).pathname.startsWith("/api/")) return platformRequest(request, env);
    // Only published catalog records are accessible to the SSR loader through this bridge.
    globalThis.__AGAS_PUBLIC_CATALOG__ = id => env.PLATFORM.getByName("agas-platform-v1")
      .fetch(new Request("https://agas.internal/api/catalog/" + encodeURIComponent(id)));
    return frontend.fetch(request, env, ctx);
  }
};
`,
);
const configPath = `${directory}/wrangler.json`;
const config = JSON.parse(readFileSync(configPath, "utf8"));
config.compatibility_date = "2026-10-01";
config.durable_objects = { bindings: [{ name: "PLATFORM", class_name: "PlatformStore" }] };
config.migrations = [{ tag: "agas-platform-v1", new_sqlite_classes: ["PlatformStore"] }];
config.keep_vars = true;
writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
console.log("Cloudflare API bundled with persistent SQLite Durable Object.");
