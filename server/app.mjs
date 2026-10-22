import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import multer from "multer";
import nodemailer from "nodemailer";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, randomUUID } from "node:crypto";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
  buyer,
  checkout,
  credentials,
  register,
  fail,
  hash,
  passwordHash,
  passwordValid,
  quote,
  mapRows,
  validateProduct,
  fields,
} from "./domain.mjs";
import { readUpload, template, workbook } from "./workbooks.mjs";
import { invoicePdf } from "./pdf.mjs";
import { exchangeRate } from "./fx.mjs";

export function configFromEnv(env = process.env) {
  const vat = env.SELLER_VAT_RATE ? Number(env.SELLER_VAT_RATE) : null;
  const delivery = Number(env.DELIVERY_MINOR || 0);
  if (
    (vat !== null && (!Number.isFinite(vat) || vat < 0 || vat > 100)) ||
    !Number.isSafeInteger(delivery) ||
    delivery < 0
  )
    throw Error("Некорректная конфигурация НДС или доставки");
  const seller = {
    name: env.SELLER_NAME || "AGAS",
    address: env.SELLER_ADDRESS || "",
    bin: env.SELLER_BIN || "",
    bank: env.SELLER_BANK || "",
    iban: env.SELLER_IBAN || "",
    bik: env.SELLER_BIK || "",
  };
  const sellerReady =
    Object.values(seller).every(Boolean) &&
    /^\d{12}$/.test(seller.bin) &&
    /^KZ[A-Z0-9]{18}$/.test(seller.iban) &&
    /^[A-Z0-9]{8}(?:[A-Z0-9]{3})?$/.test(seller.bik);
  return {
    seller,
    sellerReady,
    allowProvisional: env.REQUIRE_SELLER_DETAILS !== "true",
    vatRate: vat,
    deliveryMinor: delivery,
    production: env.NODE_ENV === "production",
    origins: (env.ALLOWED_ORIGINS || "http://localhost:3000,http://localhost:3001")
      .split(",")
      .map((s) => s.trim()),
    smtp: env.SMTP_URL,
    mailFrom: env.MAIL_FROM,
  };
}
export function createApp({
  dbPath = resolve("server/data/agas.sqlite"),
  config = configFromEnv(),
  seedPath = resolve("server/catalog.seed.json"),
  database,
  migration,
  seedData,
  renderPdf = invoicePdf,
} = {}) {
  if (!database && dbPath !== ":memory:") mkdirSync(dirname(dbPath), { recursive: true });
  const db = database || new DatabaseSync(dbPath);
  if (!database)
    db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
  db.exec(
    migration ?? readFileSync(new URL("./migrations/001-platform.sql", import.meta.url), "utf8"),
  );
  const run = (sql, ...args) => db.prepare(sql).run(...args);
  const get = (sql, ...args) => db.prepare(sql).get(...args);
  const all = (sql, ...args) => db.prepare(sql).all(...args);
  const transaction = (fn) => {
    if (db.transactionSync) return db.transactionSync(fn);
    db.exec("BEGIN IMMEDIATE");
    try {
      const v = fn();
      db.exec("COMMIT");
      return v;
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  };
  run("INSERT OR IGNORE INTO suppliers(id,name) VALUES(?,?)", "agas", "AGAS");
  if (seedData || existsSync(seedPath)) {
    const seeds = seedData ?? JSON.parse(readFileSync(seedPath, "utf8"));
    transaction(() => {
      for (const p of seeds)
        run(
          "INSERT OR IGNORE INTO products(id,supplier_id,sku,data,price_minor,stock,published) VALUES(?,?,?,?,?,?,1)",
          p.id,
          "agas",
          p.sku,
          JSON.stringify(p),
          p.price_minor,
          p.stock,
        );
    });
  }
  const publicProduct = (p) => ({
    ...JSON.parse(p.data),
    id: p.id,
    supplier_id: p.supplier_id,
    sku: p.sku,
    price_minor: p.price_minor,
    stock: p.stock,
    published: Boolean(p.published),
  });
  const lookup = (id) => {
    const p = get("SELECT * FROM products WHERE id=?", id);
    return p ? publicProduct(p) : null;
  };
  const app = express();
  app.disable("x-powered-by");
  if (config.trustProxy) app.set("trust proxy", config.trustProxy);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: (origin, cb) => cb(null, !origin || config.origins.includes(origin)),
      credentials: true,
    }),
  );
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("Origin");
      if (!origin || !config.origins.includes(origin))
        return res.status(403).json({ error: "Источник запроса не разрешён" });
    }
    next();
  });
  app.use(express.json({ limit: "12mb" }));
  app.use(cookieParser());
  app.use(
    rateLimit({ windowMs: 60000, limit: 240, standardHeaders: "draft-7", legacyHeaders: false }),
  );
  const authRate = rateLimit({
    windowMs: 15 * 60000,
    limit: 30,
    message: { error: "Слишком много попыток. Попробуйте позже" },
  });
  app.use((req, res, next) => {
    const token = req.cookies.agas_session;
    if (token)
      req.user = get(
        "SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires>?",
        hash(token),
        Date.now(),
      );
    next();
  });
  const auth = (req, res, next) =>
    req.user ? next() : res.status(401).json({ error: "Войдите в аккаунт" });
  const staff = (req, res, next) =>
    auth(req, res, () =>
      req.user.supplier_id ? next() : res.status(403).json({ error: "Доступ только поставщикам" }),
    );
  const editor = (req, res, next) =>
    staff(req, res, () =>
      ["owner", "editor"].includes(req.user.role)
        ? next()
        : res.status(403).json({ error: "Недостаточно прав для изменения каталога" }),
    );
  const me = (u) => ({
    guest: u.email.endsWith("@guest.invalid"),
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    supplierId: u.supplier_id,
    supplierName: u.supplier_id
      ? get("SELECT name FROM suppliers WHERE id=?", u.supplier_id)?.name
      : null,
  });
  const startSession = (res, id) => {
    const token = randomBytes(32).toString("hex");
    run("DELETE FROM sessions WHERE expires<?", Date.now());
    run("INSERT INTO sessions VALUES(?,?,?)", hash(token), id, Date.now() + 7 * 86400000);
    res.cookie("agas_session", token, {
      httpOnly: true,
      secure: config.production,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 86400000,
    });
  };
  app.get("/api/health", (req, res) => res.json({ ok: true }));
  app.get("/api/fx", async (req, res) => res.json(await exchangeRate()));
  app.get("/api/config", (req, res) =>
    res.json({
      sellerReady: config.sellerReady || Boolean(config.allowProvisional),
      provisional: !config.sellerReady && Boolean(config.allowProvisional),
      sellerName: config.seller.name,
      deliveryMinor: config.deliveryMinor,
      vatRate: config.vatRate,
      emailReady: Boolean(config.smtp && config.mailFrom),
      currency: "KZT",
    }),
  );
  app.post("/api/auth/register", authRate, (req, res) => {
    const data = register.parse(req.body);
    if (get("SELECT id FROM users WHERE email=?", data.email))
      fail("Этот email уже зарегистрирован", 409);
    const id = randomUUID(),
      supplierId = data.kind === "supplier" ? randomUUID() : null;
    transaction(() => {
      if (supplierId)
        run("INSERT INTO suppliers(id,name) VALUES(?,?)", supplierId, data.company || data.name);
      run(
        "INSERT INTO users VALUES(?,?,?,?,?,?)",
        id,
        data.email,
        passwordHash(data.password),
        data.name,
        supplierId ? "owner" : "buyer",
        supplierId,
      );
    });
    startSession(res, id);
    res.status(201).json(me(get("SELECT * FROM users WHERE id=?", id)));
  });
  app.post("/api/auth/guest", authRate, (req, res) => {
    if (req.user) return res.json(me(req.user));
    const id = randomUUID();
    run(
      "INSERT INTO users VALUES(?,?,?,?,?,?)",
      id,
      `${id}@guest.invalid`,
      passwordHash(randomBytes(32).toString("hex")),
      "Гость",
      "buyer",
      null,
    );
    startSession(res, id);
    res.status(201).json(me(get("SELECT * FROM users WHERE id=?", id)));
  });
  app.post("/api/auth/login", authRate, (req, res) => {
    const data = credentials.parse(req.body);
    const user = get("SELECT * FROM users WHERE email=?", data.email);
    if (!user || !passwordValid(data.password, user.password))
      fail("Неверный email или пароль", 401);
    startSession(res, user.id);
    res.json(me(user));
  });
  app.post("/api/auth/logout", (req, res) => {
    if (req.cookies.agas_session)
      run("DELETE FROM sessions WHERE token=?", hash(req.cookies.agas_session));
    res.clearCookie("agas_session", { path: "/" }).json({ ok: true });
  });
  app.get("/api/auth/me", auth, (req, res) => res.json(me(req.user)));
  app.get("/api/catalog", (req, res) =>
    res.json(
      all("SELECT * FROM products WHERE published=1 ORDER BY updated_at DESC,id").map(
        publicProduct,
      ),
    ),
  );
  app.get("/api/catalog/:id", (req, res) => {
    const p = lookup(req.params.id);
    if (!p?.published) fail("Товар не найден", 404);
    res.json(p);
  });
  app.post("/api/quote", (req, res) => {
    const input = checkout.parse(req.body);
    res.json(quote(input, lookup, config));
  });
  function invoiceData(row) {
    return {
      ...JSON.parse(row.snapshot),
      id: row.id,
      number: `AGAS-${String(row.seq).padStart(8, "0")}`,
      status: row.status,
      createdAt: row.created_at.includes("T")
        ? row.created_at
        : row.created_at.replace(" ", "T") + "Z",
      versions: all(
        "SELECT version,sha256,created_at FROM invoice_pdfs WHERE invoice_id=? ORDER BY version",
        row.id,
      ),
    };
  }
  const ownedInvoice = (req) => {
    const row = get("SELECT * FROM invoices WHERE id=? AND user_id=?", req.params.id, req.user.id);
    if (!row) fail("Счёт не найден", 404);
    return row;
  };
  app.post("/api/invoices", auth, async (req, res) => {
    const input = checkout.parse(req.body);
    const key = z.string().uuid().parse(req.get("Idempotency-Key"));
    const fingerprint = hash(JSON.stringify(input));
    const previous = get(
      "SELECT * FROM invoices WHERE user_id=? AND request_key=?",
      req.user.id,
      key,
    );
    let row;
    if (previous) {
      if (previous.request_hash !== fingerprint)
        fail("Ключ запроса уже использован с другими данными", 409);
      row = previous;
    } else {
      if (!config.sellerReady && !config.allowProvisional)
        fail("Продавец ещё не заполнил реквизиты для выставления счёта. Обратитесь в AGAS", 503);
      row = transaction(() => {
        const q = quote(input, lookup, config);
        const id = randomUUID();
        run(
          "INSERT INTO invoices(id,user_id,request_key,request_hash,snapshot) VALUES(?,?,?,?,?)",
          id,
          req.user.id,
          key,
          fingerprint,
          JSON.stringify({
            ...q,
            buyer: input.buyer,
            seller: config.seller,
            provisional: !config.sellerReady,
          }),
        );
        for (const l of q.lines)
          run(
            "INSERT INTO order_lines VALUES(?,?,?,?,?,?,?,?)",
            id,
            l.supplierId,
            l.productId,
            l.name,
            l.sku,
            l.quantity,
            l.unitMinor,
            l.totalMinor,
          );
        return get("SELECT * FROM invoices WHERE id=?", id);
      });
    }
    if (!get("SELECT version FROM invoice_pdfs WHERE invoice_id=?", row.id)) {
      const pdf = await renderPdf(invoiceData(row));
      run(
        "INSERT OR IGNORE INTO invoice_pdfs(invoice_id,version,content,sha256) VALUES(?,1,?,?)",
        row.id,
        pdf,
        hash(pdf),
      );
    }
    res.status(previous ? 200 : 201).json(invoiceData(row));
  });
  app.get("/api/invoices", auth, (req, res) =>
    res.json(
      all("SELECT * FROM invoices WHERE user_id=? ORDER BY seq DESC", req.user.id).map(invoiceData),
    ),
  );
  app.get("/api/invoices/:id", auth, (req, res) => res.json(invoiceData(ownedInvoice(req))));
  app.get("/api/invoices/:id/pdf", auth, (req, res) => {
    ownedInvoice(req);
    const v = z.coerce
      .number()
      .int()
      .positive()
      .parse(req.query.version || 1);
    const pdf = get(
      "SELECT content FROM invoice_pdfs WHERE invoice_id=? AND version=?",
      req.params.id,
      v,
    );
    if (!pdf) fail("PDF ещё не сформирован. Повторите создание счёта", 404);
    res
      .set("Content-Type", "application/pdf")
      .set(
        "Content-Disposition",
        `${req.query.download === "1" ? "attachment" : "inline"}; filename="AGAS-${req.params.id}-v${v}.pdf"`,
      )
      .send(Buffer.from(pdf.content));
  });
  app.post(
    "/api/invoices/:id/email",
    auth,
    rateLimit({ windowMs: 3600000, limit: 10, message: { error: "Лимит отправок исчерпан" } }),
    async (req, res) => {
      const row = ownedInvoice(req);
      const recipient = z.string().email().max(254).parse(req.body.email);
      if (!config.smtp || !config.mailFrom)
        fail("Отправка почты пока недоступна. Скачайте PDF или попробуйте позже", 503);
      const pdf = get(
        "SELECT content FROM invoice_pdfs WHERE invoice_id=? ORDER BY version DESC",
        row.id,
      );
      if (!pdf) fail("PDF не найден", 409);
      const transport = nodemailer.createTransport(config.smtp);
      const id = randomUUID();
      run(
        "INSERT INTO mail_log(id,invoice_id,recipient,status) VALUES(?,?,?,?)",
        id,
        row.id,
        recipient,
        "sending",
      );
      try {
        await transport.sendMail({
          from: config.mailFrom,
          to: recipient,
          subject: `Счёт ${invoiceData(row).number} · AGAS`,
          text: "Ваш счёт во вложении. Счёт ожидает оплаты.",
          attachments: [{ filename: "AGAS-invoice.pdf", content: Buffer.from(pdf.content) }],
        });
        run("UPDATE mail_log SET status=? WHERE id=?", "sent", id);
        res.json({ ok: true });
      } catch {
        run("UPDATE mail_log SET status=? WHERE id=?", "failed", id);
        fail("Не удалось отправить письмо. Попробуйте позже", 502);
      }
    },
  );
  app.get("/api/supplier/products", staff, (req, res) =>
    res.json(
      all(
        "SELECT * FROM products WHERE supplier_id=? ORDER BY updated_at DESC,id",
        req.user.supplier_id,
      ).map(publicProduct),
    ),
  );
  app.post("/api/supplier/products", editor, (req, res) => {
    const p = validateProduct(req.body);
    const existing = get(
      "SELECT id FROM products WHERE supplier_id=? AND sku=?",
      req.user.supplier_id,
      p.sku,
    );
    const id = existing?.id || randomUUID();
    upsert(req.user.supplier_id, p, id);
    res.json(lookup(id));
  });
  function upsert(supplierId, p, id = randomUUID()) {
    run(
      "INSERT INTO products(id,supplier_id,sku,data,price_minor,stock,published) VALUES(?,?,?,?,?,?,1) ON CONFLICT(supplier_id,sku) DO UPDATE SET data=excluded.data,price_minor=excluded.price_minor,stock=excluded.stock,published=1,updated_at=CURRENT_TIMESTAMP",
      id,
      supplierId,
      p.sku,
      JSON.stringify(p),
      Math.round(p.price * 100),
      p.stock,
    );
  }
  app.patch("/api/supplier/products/:id", editor, (req, res) => {
    const p = get(
      "SELECT id FROM products WHERE id=? AND supplier_id=?",
      req.params.id,
      req.user.supplier_id,
    );
    if (!p) fail("Товар не найден", 404);
    const { published } = z.object({ published: z.boolean() }).strict().parse(req.body);
    run("UPDATE products SET published=? WHERE id=?", published ? 1 : 0, p.id);
    res.json({ ok: true });
  });
  app.get("/api/supplier/orders", staff, (req, res) =>
    res.json(
      all(
        "SELECT l.*,i.seq,i.status,i.created_at FROM order_lines l JOIN invoices i ON i.id=l.invoice_id WHERE l.supplier_id=? ORDER BY i.seq DESC",
        req.user.supplier_id,
      ),
    ),
  );
  app.get("/api/supplier/analytics", staff, (req, res) => {
    const p = all("SELECT * FROM products WHERE supplier_id=?", req.user.supplier_id);
    const lines = all("SELECT * FROM order_lines WHERE supplier_id=?", req.user.supplier_id);
    res.json({
      products: p.length,
      published: p.filter((v) => v.published).length,
      lowStock: p.filter((v) => v.stock < 5).length,
      orders: new Set(lines.map((l) => l.invoice_id)).size,
      invoicedMinor: lines.reduce((a, l) => a + l.total_minor, 0),
      paidMinor: 0,
      series: Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setUTCDate(1);
        d.setUTCMonth(d.getUTCMonth() - 11 + i);
        const month = d.toISOString().slice(0, 7);
        const aggregate = get(
          "SELECT coalesce(sum(l.total_minor),0) AS totalMinor,count(DISTINCT l.invoice_id) AS orders FROM order_lines l JOIN invoices i ON i.id=l.invoice_id WHERE l.supplier_id=? AND substr(i.created_at,1,7)=?",
          req.user.supplier_id,
          month,
        );
        return { month, ...aggregate };
      }),
      categories: p.reduce((a, v) => {
        const c = JSON.parse(v.data).category;
        a[c] = (a[c] || 0) + 1;
        return a;
      }, {}),
    });
  });
  app.get("/api/supplier/profile", staff, (req, res) =>
    res.json({
      supplier: get("SELECT * FROM suppliers WHERE id=?", req.user.supplier_id),
      members: all(
        "SELECT id,name,email,role FROM users WHERE supplier_id=?",
        req.user.supplier_id,
      ),
    }),
  );
  app.post("/api/supplier/team", staff, (req, res) => {
    if (req.user.role !== "owner") fail("Только владелец может добавлять сотрудников", 403);
    const data = credentials
      .extend({ name: z.string().trim().min(2).max(120), role: z.enum(["editor", "analyst"]) })
      .parse(req.body);
    if (get("SELECT id FROM users WHERE email=?", data.email)) fail("Email уже занят", 409);
    run(
      "INSERT INTO users VALUES(?,?,?,?,?,?)",
      randomUUID(),
      data.email,
      passwordHash(data.password),
      data.name,
      data.role,
      req.user.supplier_id,
    );
    res.status(201).json({ ok: true });
  });
  app.get("/api/supplier/leads", staff, (req, res) =>
    res.json(
      all("SELECT * FROM leads WHERE supplier_id=? ORDER BY created_at DESC", req.user.supplier_id),
    ),
  );
  app.post("/api/supplier/leads", editor, (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(2).max(160),
        email: z.string().email().max(254),
        note: z.string().trim().max(2000),
      })
      .parse(req.body);
    run(
      "INSERT INTO leads(id,supplier_id,name,email,note) VALUES(?,?,?,?,?)",
      randomUUID(),
      req.user.supplier_id,
      data.name,
      data.email,
      data.note,
    );
    res.status(201).json({ ok: true });
  });
  app.patch("/api/supplier/leads/:id", editor, (req, res) => {
    const status = z.enum(["new", "contacted", "won", "lost"]).parse(req.body.status);
    const result = run(
      "UPDATE leads SET status=? WHERE id=? AND supplier_id=?",
      status,
      req.params.id,
      req.user.supplier_id,
    );
    if (!result.changes) fail("Контакт не найден", 404);
    res.json({ ok: true });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 1 },
  });
  app.get("/api/supplier/template", staff, async (req, res) =>
    sendXlsx(res, await template(), "AGAS-template.xlsx"),
  );
  app.post("/api/supplier/imports/preview", editor, upload.single("file"), async (req, res) => {
    if (!req.file) fail("Выберите файл");
    const index = z.coerce
      .number()
      .int()
      .min(0)
      .max(99)
      .parse(req.body.sheet || 0);
    const payload = await readUpload(req.file.buffer, req.file.originalname, index);
    const id = randomUUID();
    run("DELETE FROM imports WHERE report IS NULL AND created_at < datetime('now','-1 day')");
    run(
      "INSERT INTO imports(id,supplier_id,user_id,file_name,payload) VALUES(?,?,?,?,?)",
      id,
      req.user.supplier_id,
      req.user.id,
      req.file.originalname.slice(0, 200),
      JSON.stringify(payload),
    );
    res.json({ id, ...payload, images: undefined, imageRows: Object.keys(payload.images) });
  });
  function ownImport(req) {
    const i = get(
      "SELECT * FROM imports WHERE id=? AND supplier_id=?",
      req.params.id,
      req.user.supplier_id,
    );
    if (!i) fail("Загрузка не найдена", 404);
    return i;
  }
  function mappingInput(body) {
    return z
      .object({
        mapping: z.record(z.string().regex(/^\d+$/), z.enum(["", ...Object.keys(fields)])),
        allowPartial: z.boolean().default(false),
      })
      .strict()
      .parse(body);
  }
  app.post("/api/supplier/imports/:id/validate", editor, (req, res) => {
    const i = ownImport(req);
    const input = mappingInput(req.body);
    res.json(mapRows(JSON.parse(i.payload), input.mapping));
  });
  app.post("/api/supplier/imports/:id/commit", editor, (req, res) => {
    const i = ownImport(req);
    if (i.report) return res.json(JSON.parse(i.report));
    const input = mappingInput(req.body);
    const rows = mapRows(JSON.parse(i.payload), input.mapping);
    const errors = rows.filter((r) => r.errors.length);
    if (errors.length && !input.allowPartial)
      fail("Есть ошибки. Исправьте файл или разрешите пропуск некорректных строк", 422);
    if (errors.length === rows.length) fail("Нет корректных строк для сохранения", 422);
    const report = transaction(() => {
      let created = 0,
        updated = 0;
      for (const r of rows) {
        if (!r.value) continue;
        const existing = get(
          "SELECT id FROM products WHERE supplier_id=? AND sku=?",
          req.user.supplier_id,
          r.value.sku,
        );
        if (existing) updated++;
        else created++;
        upsert(req.user.supplier_id, r.value, existing?.id);
      }
      const report = {
        created,
        updated,
        skipped: errors.length,
        total: rows.length,
        rows: rows.map((r) => ({
          row: r.row,
          sku: r.value?.sku || "",
          status: r.errors.length ? "Ошибка" : "Сохранено",
          errors: r.errors.join("; "),
        })),
      };
      run("UPDATE imports SET report=?,payload=? WHERE id=?", JSON.stringify(report), "{}", i.id);
      return report;
    });
    res.json(report);
  });
  app.get("/api/supplier/imports", staff, (req, res) =>
    res.json(
      all(
        "SELECT id,file_name,created_at,report FROM imports WHERE supplier_id=? AND report IS NOT NULL ORDER BY created_at DESC",
        req.user.supplier_id,
      ).map((i) => ({ ...i, report: JSON.parse(i.report) })),
    ),
  );
  function sendXlsx(res, buffer, name) {
    res
      .type("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .set("Content-Disposition", `attachment; filename="${name}"`)
      .send(buffer);
  }
  app.get("/api/supplier/imports/:id/report", staff, async (req, res) => {
    const i = ownImport(req);
    if (!i.report) fail("Отчёт ещё не готов", 409);
    const r = JSON.parse(i.report);
    sendXlsx(
      res,
      await workbook(
        "Результат импорта",
        ["Строка", "Артикул", "Результат", "Ошибки"],
        r.rows.map((v) => [v.row, v.sku, v.status, v.errors]),
      ),
      "AGAS-import-report.xlsx",
    );
  });
  app.get("/api/supplier/export", staff, async (req, res) => {
    const products = all("SELECT * FROM products WHERE supplier_id=?", req.user.supplier_id).map(
      publicProduct,
    );
    sendXlsx(
      res,
      await workbook(
        "Товары",
        Object.values(fields),
        products.map((p) =>
          Object.keys(fields).map((k) =>
            k === "price"
              ? p.price_minor / 100
              : k === "image" && p[k]?.startsWith("data:")
                ? "Встроенное изображение (экспорт без изображения)"
                : (p[k] ?? ""),
          ),
        ),
      ),
      "AGAS-products.xlsx",
    );
  });
  app.get("/api/supplier/orders/export", staff, async (req, res) => {
    const lines = all(
      "SELECT l.*,i.seq,i.created_at FROM order_lines l JOIN invoices i ON i.id=l.invoice_id WHERE l.supplier_id=? ORDER BY i.seq DESC",
      req.user.supplier_id,
    );
    sendXlsx(
      res,
      await workbook(
        "Заказы",
        ["Счёт", "Дата", "Артикул", "Товар", "Количество", "Цена KZT", "Сумма KZT", "Статус"],
        lines.map((l) => [
          `AGAS-${String(l.seq).padStart(8, "0")}`,
          l.created_at,
          l.sku,
          l.name,
          l.quantity,
          l.unit_minor / 100,
          l.total_minor / 100,
          "Ожидает оплаты",
        ]),
      ),
      "AGAS-orders.xlsx",
    );
  });
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    const status =
      err instanceof z.ZodError ? 422 : err.code === "LIMIT_FILE_SIZE" ? 413 : err.status || 500;
    const message =
      err instanceof z.ZodError
        ? err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
        : status >= 500
          ? "Не удалось выполнить действие. Попробуйте позже"
          : err.message;
    if (status >= 500) console.error("AGAS request failed", err.name, err.code || "");
    res.status(status).json({ error: message });
  });
  return { app, db };
}
