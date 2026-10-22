import { DurableObject } from "cloudflare:workers";
import { httpServerHandler } from "cloudflare:node";
import { createApp, configFromEnv } from "../server/app.mjs";
import { invoicePdf } from "../server/pdf.mjs";
import { durableDatabase } from "./sqlite.mjs";
import migration from "../server/migrations/001-platform.sql";
import seedData from "../server/catalog.seed.json";
import regular from "../server/fonts/NotoSans-Regular.ttf";
import bold from "../server/fonts/NotoSans-Bold.ttf";

export class PlatformStore extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    const config = {
      ...configFromEnv({
        ...env,
        NODE_ENV: "production",
        ALLOWED_ORIGINS:
          env.ALLOWED_ORIGINS || "https://agas.kz,https://www.agas.kz,https://seller.agas.kz",
      }),
      trustProxy: 1,
    };
    const { app } = createApp({
      database: durableDatabase(ctx.storage),
      migration,
      seedData,
      config,
      renderPdf: (invoice) =>
        invoicePdf(invoice, { regular: Buffer.from(regular), bold: Buffer.from(bold) }),
    });
    app.listen(4900);
    this.handler = httpServerHandler({ port: 4900 });
  }
  fetch(request) {
    return this.handler.fetch(request);
  }
}

export function platformRequest(request, env) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    const allowed = (
      env.ALLOWED_ORIGINS || "https://agas.kz,https://www.agas.kz,https://seller.agas.kz"
    )
      .split(",")
      .map((value) => value.trim());
    if (!allowed.includes(request.headers.get("Origin")))
      return Response.json(
        { error: "Источник запроса не разрешён" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
  }
  const headers = new Headers(request.headers);
  // Never trust a client-supplied forwarding header in Express.
  headers.set("X-Forwarded-For", request.headers.get("CF-Connecting-IP") || "127.0.0.1");
  return env.PLATFORM.getByName("agas-platform-v1").fetch(new Request(request, { headers }));
}
