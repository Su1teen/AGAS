import { Buffer } from "node:buffer";

// Implements the synchronous interface used by the shared API on Durable SQL.
// Transaction statements cannot be issued through sql.exec in Durable Objects.
export function durableDatabase(storage) {
  const sql = storage.sql;
  const bind = (values) => {
    const bytes = values.reduce(
      (sum, value) =>
        sum + (typeof value === "string" ? Buffer.byteLength(value) : value?.byteLength || 0),
      0,
    );
    if (bytes > 1_800_000) {
      const error = new Error(
        "Объём одной записи превышает лимит хранилища. Разделите файл на части или уменьшите изображения.",
      );
      error.status = 413;
      throw error;
    }
    return values.map((value) =>
      ArrayBuffer.isView(value)
        ? value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
        : value,
    );
  };
  return {
    exec(query) {
      sql.exec(query.replace(/PRAGMA foreign_keys=ON;/gi, ""));
    },
    prepare(query) {
      return {
        all(...args) {
          return sql.exec(query, ...bind(args)).toArray();
        },
        get(...args) {
          return sql.exec(query, ...bind(args)).toArray()[0];
        },
        run(...args) {
          const cursor = sql.exec(query, ...bind(args));
          const changes = cursor.rowsWritten;
          const lastInsertRowid = sql.exec("SELECT last_insert_rowid() AS id").one().id;
          return { changes, lastInsertRowid };
        },
      };
    },
    transactionSync(fn) {
      return storage.transactionSync(fn);
    },
    close() {},
  };
}
