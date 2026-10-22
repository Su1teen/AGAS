// The Worker injects durableDatabase; the Node entry retains node:sqlite.
export class DatabaseSync {
  constructor() {
    throw new Error("Cloudflare требует привязанное SQLite-хранилище");
  }
}
