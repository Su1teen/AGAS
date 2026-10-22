import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, sep } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { unstable_dev } from "wrangler";
import ExcelJS from "exceljs";

test(
  "Cloudflare SQLite: XLSX import, tenant isolation, protected PDF, idempotency and restart",
  { timeout: 120000 },
  async () => {
    const directory = mkdtempSync(resolve(tmpdir(), "agas-cloudflare-test-"));
    const origin = "https://agas.test";
    const options = {
      config: resolve("dist/server/wrangler.json"),
      local: true,
      logLevel: "error",
      persistTo: directory,
      vars: {
        ALLOWED_ORIGINS: origin,
        SELLER_NAME: "ТЕСТОВЫЕ ДАННЫЕ — НЕ ДЛЯ ОПЛАТЫ",
        SELLER_ADDRESS: "Тестовый адрес",
        SELLER_BIN: "000000000000",
        SELLER_BANK: "Тестовый банк",
        SELLER_IBAN: "KZ000000000000000000",
        SELLER_BIK: "TESTKZ00",
      },
      experimental: { disableExperimentalWarning: true, disableDevRegistry: true, watch: false },
    };
    let worker;
    const start = async () => {
      worker = await unstable_dev(resolve("dist/server/index.mjs"), options);
    };
    const client = () => {
      let cookie = "";
      return async (path, body, extra = {}) => {
        const headers = { Origin: origin, Cookie: cookie, ...extra.headers };
        if (body !== undefined && !(body instanceof FormData))
          headers["Content-Type"] = "application/json";
        const response = await fetch(`http://${worker.address}:${worker.port}/api${path}`, {
          method: body === undefined ? "GET" : "POST",
          ...extra,
          headers,
          body:
            body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
        });
        const session = response.headers.get("set-cookie");
        if (session) cookie = session.split(";")[0];
        const binary = !(response.headers.get("content-type") || "").includes("application/json");
        const data = binary ? Buffer.from(await response.arrayBuffer()) : await response.json();
        return { status: response.status, data, headers: response.headers };
      };
    };
    try {
      await start();
      const supplier = client(),
        other = client(),
        guest = client(),
        stranger = client();
      const signup = (name) => ({
        name,
        email: `${randomUUID()}@example.test`,
        password: "Test-password-12345",
        kind: "supplier",
        company: name,
      });
      assert.equal((await supplier("/auth/register", signup("Проверка Cloudflare"))).status, 201);
      assert.equal((await other("/auth/register", signup("Другой поставщик"))).status, 201);
      const book = new ExcelJS.Workbook();
      const sheet = book.addWorksheet("Товары");
      sheet.addRow(["Артикул", "Название", "Категория", "Цена", "Остаток", "Фото", "ISO"]);
      for (let i = 0; i < 120; i++)
        sheet.addRow([
          `CF-${i}`,
          `Светильник ${i}`,
          "Освещение",
          1250.5,
          30,
          "https://example.test/light.png",
          "ISO 9001",
        ]);
      sheet.addRow(["CF-BAD", "Ошибка цены", "Освещение", -1, 2]);
      const image = book.addImage({
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aCksAAAAASUVORK5CYII=",
          "base64",
        ),
        extension: "png",
      });
      sheet.addImage(image, { tl: { col: 5, row: 1 }, ext: { width: 32, height: 32 } });
      const form = new FormData();
      form.append("file", new Blob([await book.xlsx.writeBuffer()]), "Ассортимент.xlsx");
      const preview = await supplier("/supplier/imports/preview", form);
      assert.equal(preview.status, 200, JSON.stringify(preview.data));
      assert.equal(preview.data.rows.length, 121);
      const mapping = {
        0: "sku",
        1: "name",
        2: "category",
        3: "price",
        4: "stock",
        5: "image",
        6: "iso",
      };
      const imported = preview.data.id;
      assert.equal(
        (await supplier(`/supplier/imports/${imported}/commit`, { mapping })).status,
        422,
      );
      const committed = await supplier(`/supplier/imports/${imported}/commit`, {
        mapping,
        allowPartial: true,
      });
      assert.equal(committed.status, 200, JSON.stringify(committed.data));
      assert.equal(committed.data.created, 120);
      assert.equal(committed.data.skipped, 1);
      assert.deepEqual(
        (await supplier(`/supplier/imports/${imported}/commit`, { mapping, allowPartial: true }))
          .data,
        committed.data,
      );
      assert.equal((await other(`/supplier/imports/${imported}/report`)).status, 404);
      assert.equal((await other("/supplier/products")).data.length, 0);
      const products = (await supplier("/supplier/products")).data;
      assert.equal(products.length, 120);
      const productPage = await fetch(
        `http://${worker.address}:${worker.port}/product/${products[0].id}`,
      );
      assert.equal(productPage.status, 200);
      assert.ok(
        (await productPage.text()).includes(products[0].name),
        "Published product supports a direct page link",
      );
      assert.equal((await guest("/catalog")).data.length, 197);
      const exportBook = await supplier("/supplier/export");
      assert.equal(exportBook.status, 200);
      const exported = new ExcelJS.Workbook();
      await exported.xlsx.load(exportBook.data);
      assert.equal(exported.worksheets[0].rowCount, 121);
      assert.equal((await guest("/auth/guest", {})).status, 201);
      const checkout = {
        buyer: {
          kind: "individual",
          name: "Тестовый покупатель",
          email: "buyer@example.test",
          phone: "+77000000000",
          country: "KZ",
          city: "Астана",
          address: "Тестовый адрес, не для отправки",
          postalCode: "010000",
        },
        delivery: "pickup",
        items: [{ productId: products[0].id, quantity: 2 }],
      };
      const key = randomUUID();
      const invoice = await guest("/invoices", checkout, { headers: { "Idempotency-Key": key } });
      assert.equal(invoice.status, 201, JSON.stringify(invoice.data));
      assert.equal(invoice.data.status, "awaiting_payment");
      assert.equal(invoice.data.totalMinor, 250100);
      assert.equal(
        (await guest("/invoices", checkout, { headers: { "Idempotency-Key": key } })).data.id,
        invoice.data.id,
      );
      const pdfPath = `/invoices/${invoice.data.id}/pdf`;
      const pdf = await guest(pdfPath);
      assert.equal(pdf.status, 200);
      assert.equal(pdf.data.subarray(0, 4).toString(), "%PDF");
      assert.ok(pdf.data.includes(Buffer.from("/ToUnicode")), "Cyrillic font mapping embedded");
      assert.equal(
        createHash("sha256").update(pdf.data).digest("hex"),
        invoice.data.versions[0].sha256,
      );
      assert.equal((await stranger(pdfPath)).status, 401);
      assert.equal((await other(pdfPath)).status, 404);
      assert.equal(
        (await guest(`/invoices/${invoice.data.id}/email`, { email: "buyer@example.test" })).status,
        503,
      );
      assert.equal((await supplier("/supplier/orders")).data.length, 1);
      assert.equal(
        (await guest("/auth/guest", {}, { headers: { Origin: "https://untrusted.test" } })).status,
        403,
      );
      if (process.env.CLOUDFLARE_PDF_OUTPUT)
        writeFileSync(process.env.CLOUDFLARE_PDF_OUTPUT, pdf.data);
      await worker.stop();
      worker = undefined;
      await start();
      assert.equal((await guest(pdfPath)).status, 200, "PDF persists across Worker restarts");
      assert.equal((await supplier("/supplier/products")).data.length, 120);
      await worker.stop();
      worker = undefined;
      options.vars = { ALLOWED_ORIGINS: origin };
      await start();
      const defaults = await guest("/config");
      assert.equal(defaults.data.sellerReady, true);
      assert.equal(defaults.data.provisional, true);
      assert.equal(defaults.data.sellerName, "AGAS");
      const provisional = await guest("/invoices", checkout, {
        headers: { "Idempotency-Key": randomUUID() },
      });
      assert.equal(provisional.status, 201);
      assert.equal(provisional.data.provisional, true);
      assert.equal(provisional.data.status, "awaiting_payment");
      assert.equal(provisional.data.seller.bin, "");
      assert.equal(provisional.data.seller.iban, "");
      const provisionalPdf = await guest(`/invoices/${provisional.data.id}/pdf`);
      assert.equal(provisionalPdf.status, 200);
      if (process.env.CLOUDFLARE_PDF_OUTPUT)
        writeFileSync(process.env.CLOUDFLARE_PDF_OUTPUT, provisionalPdf.data);
    } finally {
      if (worker) await worker.stop();
      assert.ok(resolve(directory).startsWith(resolve(tmpdir()) + sep));
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
