import { createApp, configFromEnv } from "../server/app.mjs";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = mkdtempSync(join(tmpdir(), "agas-browser-"));
const config = configFromEnv({
  SELLER_NAME: "ТЕСТОВЫЕ ДАННЫЕ — НЕ ДЛЯ ОПЛАТЫ",
  SELLER_ADDRESS: "Тестовый адрес",
  SELLER_BIN: "000000000000",
  SELLER_BANK: "Тестовый банк",
  SELLER_IBAN: "KZ000000000000000000",
  SELLER_BIK: "TESTKZ00",
  ALLOWED_ORIGINS: "http://localhost:3000,http://localhost:3001",
});
const { app, db } = createApp({ dbPath: join(dir, "e2e.sqlite"), config });
const server = app.listen(4000, "127.0.0.1");
process.on("SIGINT", () =>
  server.close(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
    process.exit();
  }),
);
