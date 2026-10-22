import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import ExcelJS from "exceljs";
import AdmZip from "adm-zip";
import { parseUsd } from "./fx.mjs";
import { createApp, configFromEnv } from "./app.mjs";
import { readUpload, workbook } from "./workbooks.mjs";
import { mapRows, validateProduct } from "./domain.mjs";

const buyer = {
  kind: "individual",
  name: "Тестовый покупатель",
  email: "buyer@example.test",
  phone: "+77000000000",
  country: "KZ",
  city: "Астана",
  address: "Тестовый адрес, не для отправки",
  postalCode: "010000",
};
const config = configFromEnv({
  SELLER_NAME: "ТЕСТОВЫЕ ДАННЫЕ — НЕ ДЛЯ ОПЛАТЫ",
  SELLER_ADDRESS: "Тестовый адрес",
  SELLER_BIN: "000000000000",
  SELLER_BANK: "Тестовый банк",
  SELLER_IBAN: "KZ000000000000000000",
  SELLER_BIK: "TESTKZ00",
  SELLER_VAT_RATE: "12",
  DELIVERY_MINOR: "250000",
  ALLOWED_ORIGINS: "http://localhost:3000,http://localhost:3001",
});
const mapping = {
  0: "sku",
  1: "name",
  2: "category",
  3: "price",
  4: "stock",
  5: "image",
  6: "iso",
  7: "invoiceRef",
};
async function start(dbPath, seedPath) {
  const { app, db } = createApp({ dbPath, seedPath, config });
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  return {
    base: `http://127.0.0.1:${server.address().port}`,
    db,
    close: () =>
      new Promise((r) =>
        server.close(() => {
          db.close();
          r();
        }),
      ),
  };
}
function client(base) {
  let cookie = "";
  return async (path, body, extra = {}) => {
    const headers = { Origin: "http://localhost:3000", Cookie: cookie, ...extra.headers };
    if (body !== undefined && !(body instanceof FormData))
      headers["Content-Type"] = "application/json";
    const res = await fetch(base + "/api" + path, {
      ...extra,
      method: extra.method || (body !== undefined ? "POST" : "GET"),
      headers,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    });
    if (res.headers.get("set-cookie")) cookie = res.headers.get("set-cookie").split(";")[0];
    const data = res.headers.get("content-type")?.includes("application/json")
      ? await res.json()
      : Buffer.from(await res.arrayBuffer());
    return { status: res.status, data, headers: res.headers };
  };
}
const signup = (name, kind = "supplier") => ({
  email: `${name}@example.test`,
  password: "Test-password-12345",
  name,
  kind,
  company: `Компания ${name}`,
});

test("FX parser validates source date, USD units and malformed values", () => {
  const fx = parseUsd(
    "<rss><item><title>USD</title><pubDate>22.10.2026</pubDate><description>500,50</description><quant>1</quant></item></rss>",
  );
  assert.equal(fx.kztPerUsd, 500.5);
  assert.equal(fx.asOf, "22.10.2026");
  assert.throws(() => parseUsd("<item><title>USD</title><description>NaN</description></item>"));
});
test("XLSX rejects a ZIP object whose real inflated size exceeds its declared size", async () => {
  const zip = new AdmZip();
  zip.addFile("xl/worksheets/sheet1.xml", Buffer.alloc(100000, 65));
  const buf = zip.toBuffer();
  const central = buf.indexOf(Buffer.from("504b0102", "hex"));
  buf.writeUInt32LE(1, central + 24);
  await assert.rejects(readUpload(buf, "bad.xlsx"), /Некорректный/);
});
test("XLSX: sheets, hyperlinks, inline/rich strings, anchored image and 120 rows", async () => {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet("Инструкция").addRow(["Не импортировать"]);
  const ws = wb.addWorksheet("Товары");
  ws.addRow(["Артикул", "Название", "Категория", "Цена", "Остаток", "Изображение"]);
  for (let i = 0; i < 120; i++) ws.addRow([`X-${i}`, `Товар ${i}`, "Освещение", 100.25, 100, ""]);
  ws.getCell("B2").value = { richText: [{ text: "Товар " }, { text: "кириллица" }] };
  ws.getCell("F3").value = { text: "Фото", hyperlink: "https://example.test/photo.png" };
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
    "base64",
  );
  const id = wb.addImage({ buffer: png, extension: "png" });
  ws.addImage(id, { tl: { col: 5, row: 1 }, ext: { width: 50, height: 50 } });
  const payload = await readUpload(Buffer.from(await wb.xlsx.writeBuffer()), "products.xlsx", 1);
  assert.equal(payload.rows.length, 120);
  assert.equal(payload.rows[0][1], "Товар кириллица");
  assert.equal(payload.rows[1][5], "https://example.test/photo.png");
  assert.match(payload.images[2], /^data:image\/png/);
  const rows = mapRows(payload, {
    0: "sku",
    1: "name",
    2: "category",
    3: "price",
    4: "stock",
    5: "image",
  });
  assert.equal(rows.filter((r) => r.errors.length).length, 0);
  assert.match(rows[0].value.image, /base64/);
  ws.getCell("D2").value = { formula: "10+1", result: 11 };
  const bad = await readUpload(Buffer.from(await wb.xlsx.writeBuffer()), "products.xlsx", 1);
  assert.ok(
    mapRows(bad, { 0: "sku", 1: "name", 2: "category", 3: "price", 4: "stock" })[0].errors.length,
  );
});
test("CSV: decimals, duplicates, missing fields, malformed numbers, skipped columns, safe exports", async () => {
  const p = await readUpload(
    Buffer.from(
      '\uFEFFАртикул;Название;Категория;Цена;Остаток;Пропустить\nA;Лампа;Свет;"1 200,50";4;текст\na;Повтор;Свет;100;4;данные\nB;Ошибка;Свет;;-1;данные',
    ),
    "a.csv",
  );
  const rows = mapRows(p, { 0: "sku", 1: "name", 2: "category", 3: "price", 4: "stock", 5: "" });
  assert.equal(rows[0].value.price, 1200.5);
  assert.match(rows[1].errors[0], /повторяется/);
  assert.ok(rows[2].errors.length);
  assert.throws(() => mapRows(p, { 0: "sku", 1: "sku" }));
  assert.throws(() =>
    validateProduct({
      sku: "X",
      name: "Товар",
      category: "Свет",
      price: 100,
      stock: 1,
      image: "http://127.0.0.1/a",
    }),
  );
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await workbook("Товары", ["Артикул", "Цена"], [["=cmd()", 12]]));
  assert.equal(wb.worksheets[0].getCell("A2").value, "'=cmd()");
  assert.equal(wb.worksheets[0].getCell("B2").value, 12);
});
test("end-to-end: import 121 rows, partial errors, upsert, tenant roles, invoice idempotency, PDF and restart", async () => {
  const dir = mkdtempSync(join(tmpdir(), "agas-platform-"));
  const dbPath = join(dir, "data.sqlite"),
    seedPath = join(dir, "seed.json");
  writeFileSync(seedPath, "[]");
  let instance = await start(dbPath, seedPath);
  try {
    const supplier = client(instance.base),
      other = client(instance.base),
      customer = client(instance.base),
      foreignBuyer = client(instance.base),
      anonymous = client(instance.base);
    assert.equal((await supplier("/auth/register", signup("supplier"))).status, 201);
    await other("/auth/register", signup("other"));
    await customer("/auth/register", signup("buyer", "buyer"));
    await foreignBuyer("/auth/register", signup("foreign", "buyer"));
    const csv = [
      "Артикул;Название;Категория;Цена;Остаток;Изображение;ISO;Накладная",
      ...Array.from(
        { length: 120 },
        (_, i) => `SKU-${i};Товар ${i};Свет;1000,25;100;;ISO 9001;Поставка-1`,
      ),
      "SKU-BAD;Ошибка;Свет;-20;1;;;",
    ].join("\n");
    const form = new FormData();
    form.append("file", new Blob([csv]), "catalog.csv");
    const preview = await supplier("/supplier/imports/preview", form);
    assert.equal(preview.status, 200);
    const importId = preview.data.id;
    const validation = await supplier(`/supplier/imports/${importId}/validate`, { mapping });
    assert.equal(validation.data.length, 121);
    assert.equal(validation.data.filter((r) => r.errors.length).length, 1);
    assert.equal((await supplier(`/supplier/imports/${importId}/commit`, { mapping })).status, 422);
    const result = await supplier(`/supplier/imports/${importId}/commit`, {
      mapping,
      allowPartial: true,
    });
    assert.equal(result.data.created, 120);
    assert.equal(result.data.skipped, 1);
    assert.deepEqual(
      (await supplier(`/supplier/imports/${importId}/commit`, { mapping, allowPartial: true }))
        .data,
      result.data,
    );
    assert.equal((await other(`/supplier/imports/${importId}/report`)).status, 404);
    assert.equal((await other("/supplier/products")).data.length, 0);
    const products = (await supplier("/supplier/products")).data;
    assert.equal(products.length, 120);
    assert.equal((await anonymous("/catalog")).data.length, 120);
    const edited = {
      sku: "SKU-0",
      name: "Обновлённый товар",
      category: "Свет",
      price: 2000.5,
      stock: 100,
    };
    assert.equal((await supplier("/supplier/products", edited)).status, 200);
    assert.equal((await supplier("/supplier/products")).data.length, 120);
    await supplier("/supplier/team", {
      email: "analyst@example.test",
      password: "Test-password-12345",
      name: "Аналитик",
      role: "analyst",
    });
    const analyst = client(instance.base);
    await analyst("/auth/login", {
      email: "analyst@example.test",
      password: "Test-password-12345",
    });
    assert.equal((await analyst("/supplier/products", edited)).status, 403);
    assert.equal((await analyst("/supplier/products")).data.length, 120);
    assert.equal((await customer("/supplier/products")).status, 403);
    const p = (await supplier("/supplier/products")).data.find((p) => p.sku === "SKU-0");
    const guest = client(instance.base);
    assert.equal((await guest("/auth/guest", {})).data.guest, true);
    const guestInvoice = await guest(
      "/invoices",
      { buyer, delivery: "pickup", items: [{ productId: p.id, quantity: 1 }] },
      { headers: { "Idempotency-Key": crypto.randomUUID() } },
    );
    assert.equal(guestInvoice.status, 201);
    assert.equal((await guest(`/invoices/${guestInvoice.data.id}/pdf`)).status, 200);
    assert.equal((await foreignBuyer(`/invoices/${guestInvoice.data.id}/pdf`)).status, 404);
    const order = {
      buyer,
      delivery: "courier",
      items: [
        { productId: p.id, quantity: 2 },
        { productId: p.id, quantity: 1 },
      ],
    };
    const key = crypto.randomUUID();
    const q = await customer("/quote", order);
    assert.equal(q.data.lines.length, 1);
    assert.equal(q.data.subtotalMinor, 600150);
    assert.equal(q.data.totalMinor, 922168);
    const [one, two] = await Promise.all([
      customer("/invoices", order, { headers: { "Idempotency-Key": key } }),
      customer("/invoices", order, { headers: { "Idempotency-Key": key } }),
    ]);
    assert.equal(one.status, 201);
    assert.equal(two.data.id, one.data.id);
    assert.equal(one.data.status, "awaiting_payment");
    assert.equal((await customer("/invoices")).data.length, 1);
    assert.equal(
      (
        await customer(
          "/invoices",
          { ...order, delivery: "pickup" },
          { headers: { "Idempotency-Key": key } },
        )
      ).status,
      409,
    );
    assert.equal((await anonymous(`/invoices/${one.data.id}/pdf`)).status, 401);
    assert.equal((await foreignBuyer(`/invoices/${one.data.id}/pdf`)).status, 404);
    assert.equal((await supplier(`/invoices/${one.data.id}/pdf`)).status, 404);
    const pdf = await customer(`/invoices/${one.data.id}/pdf`);
    assert.equal(pdf.status, 200);
    assert.equal(pdf.data.subarray(0, 4).toString(), "%PDF");
    assert.equal(
      (await customer(`/invoices/${one.data.id}/email`, { email: "buyer@example.test" })).status,
      503,
    );
    assert.equal((await supplier("/supplier/orders")).data.length, 2);
    assert.equal((await other("/supplier/orders")).data.length, 0);
    assert.equal((await supplier("/supplier/analytics")).data.invoicedMinor, 800200);
    assert.equal(
      (
        await supplier("/supplier/leads", {
          name: "Контакт",
          email: "contact@example.test",
          note: "Звонок",
        })
      ).status,
      201,
    );
    assert.equal((await other("/supplier/leads")).data.length, 0);
    const exporter = await supplier("/supplier/export");
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(exporter.data);
    assert.equal(wb.worksheets[0].rowCount, 121);
    const blocked = await supplier("/supplier/products", edited, {
      headers: { Origin: "https://untrusted.example" },
    });
    assert.equal(blocked.status, 403);
    const longOrder = {
      buyer: {
        ...buyer,
        kind: "company",
        companyName: "Тестовая организация с длинным названием для проверки переносов",
        bin: "000000000000",
      },
      delivery: "pickup",
      items: products.slice(0, 75).map((p) => ({ productId: p.id, quantity: 1 })),
    };
    const long = await customer("/invoices", longOrder, {
      headers: { "Idempotency-Key": crypto.randomUUID() },
    });
    assert.equal(long.status, 201);
    if (process.env.TEST_ARTIFACT_DIR) {
      mkdirSync(process.env.TEST_ARTIFACT_DIR, { recursive: true });
      writeFileSync(join(process.env.TEST_ARTIFACT_DIR, "invoice.pdf"), pdf.data);
      writeFileSync(
        join(process.env.TEST_ARTIFACT_DIR, "invoice-many.pdf"),
        (await customer(`/invoices/${long.data.id}/pdf`)).data,
      );
      writeFileSync(join(process.env.TEST_ARTIFACT_DIR, "catalog.xlsx"), exporter.data);
    }
    const id = one.data.id;
    await instance.close();
    instance = await start(dbPath, seedPath);
    const restored = client(instance.base);
    await restored("/auth/login", { email: "buyer@example.test", password: "Test-password-12345" });
    assert.equal((await restored(`/invoices/${id}`)).data.totalMinor, 922168);
    assert.deepEqual((await restored(`/invoices/${id}/pdf`)).data, pdf.data);
  } finally {
    await instance.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
