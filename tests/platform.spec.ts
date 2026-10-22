import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
const out = process.env["SCREENSHOT_DIR"] || "test-results/visual";
test("supplier import → marketplace checkout → invoice → supplier orders; responsive UI and failure state", async ({
  browser,
}) => {
  mkdirSync(out, { recursive: true });
  const supplierContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await supplierContext.route("**/api/fx", (r) =>
    r.fulfill({
      json: {
        kztPerUsd: 500,
        asOf: "22.10.2026",
        source: "Тестовый курс",
        sourceUrl: "https://example.test",
        stale: false,
      },
    }),
  );
  const seller = await supplierContext.newPage();
  const errors: string[] = [];
  seller.on("pageerror", (e) => errors.push(e.message));
  await seller.goto("http://localhost:3001");
  await seller.getByRole("button", { name: "Создать аккаунт", exact: true }).click();
  await seller.getByLabel("Ваше имя").fill("Тестовый поставщик");
  await seller.getByLabel("Организация", { exact: true }).fill("Компания для проверки");
  await seller.getByLabel("Электронная почта").fill(`supplier-${Date.now()}@example.test`);
  await seller.getByLabel("Пароль", { exact: true }).fill("Test-password-12345");
  await seller.getByRole("button", { name: "Зарегистрироваться", exact: true }).click();
  await expect(seller.getByRole("heading", { name: "Обзор для руководства" })).toBeVisible();
  await seller.getByRole("link", { name: "Загрузка", exact: true }).click();
  const csv = [
    "Артикул;Название;Категория;Цена;Остаток;Описание;Бренд;ISO / сертификат;Номер документа поставки",
    ...Array.from(
      { length: 110 },
      (_, i) =>
        `BROWSER-${i};Светильник ${String(i).padStart(3, "0")};Освещение;12500,50;50;Управляемое освещение для дома;AGAS;ISO 9001;Поставка-1`,
    ),
  ].join("\n");
  await seller
    .locator("input[type=file]")
    .setInputFiles({ name: "Ассортимент.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await expect(seller.getByRole("heading", { name: "Назначьте поля колонкам" })).toBeVisible();
  await seller.getByLabel("Назначение колонки Описание", { exact: true }).selectOption("");
  await seller
    .getByLabel("Назначение колонки Описание", { exact: true })
    .selectOption("description");
  await seller.getByRole("button", { name: "Проверить данные", exact: true }).click();
  await expect(seller.getByRole("heading", { name: "Данные готовы к публикации" })).toBeVisible();
  await seller.screenshot({ path: out + "/supplier-import.png", fullPage: true });
  await seller.getByRole("button", { name: "Опубликовать 110 товаров", exact: true }).click();
  await expect(seller.getByRole("heading", { name: "Каталог обновлён" })).toBeVisible();
  const download = seller.waitForEvent("download");
  await seller.getByRole("link", { name: "Скачать отчёт Excel" }).click();
  expect((await download).suggestedFilename()).toContain(".xlsx");
  await seller.getByRole("link", { name: "Каталог", exact: true }).click();
  await seller.getByRole("textbox", { name: "Поиск товаров" }).fill("BROWSER-0");
  await expect(seller.getByText("Светильник 000", { exact: true })).toBeVisible();
  await seller.getByRole("button", { name: "Колонки", exact: true }).click();
  await seller.getByLabel("ISO / сертификат", { exact: true }).uncheck();
  await seller.screenshot({ path: out + "/supplier-catalog.png", fullPage: true });
  const customerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  await customerContext.route("**/api/fx", (r) =>
    r.fulfill({
      json: {
        kztPerUsd: 500,
        asOf: "22.10.2026",
        source: "Тестовый курс",
        sourceUrl: "https://example.test",
        stale: false,
      },
    }),
  );
  const buyer = await customerContext.newPage();
  buyer.on("pageerror", (e) => errors.push(e.message));
  await buyer.goto("http://localhost:3000/catalog");
  const ownProducts = await (
    await supplierContext.request.get("http://localhost:4000/api/supplier/products")
  ).json();
  const chosen = ownProducts.find((p: { sku: string }) => p.sku === "BROWSER-0");
  const productLink = buyer.locator('a[href="/product/' + chosen.id + '"]').first();
  await productLink.click();
  await expect(buyer.getByRole("heading", { name: "Светильник 000", level: 1 })).toBeVisible();
  await buyer
    .getByRole("button", { name: /В корзину|Добавить в корзину/ })
    .first()
    .click();
  await buyer.goto("http://localhost:3000/checkout");
  await expect(buyer.getByRole("button", { name: "Зарегистрироваться", exact: true })).toHaveCount(
    0,
  );
  await buyer.getByLabel("ФИО контактного лица *", { exact: true }).fill("Тестовый покупатель");
  await buyer.getByLabel("Электронная почта *", { exact: true }).fill("guest@example.test");
  await buyer.getByLabel("Телефон *", { exact: true }).fill("+77000000000");
  await buyer.getByLabel("Город *", { exact: true }).fill("Астана");
  await buyer.getByLabel("Почтовый индекс *", { exact: true }).fill("010000");
  await buyer.getByLabel("Улица, дом, квартира / офис *", { exact: true }).fill("Тестовый адрес");
  await buyer.screenshot({ path: out + "/marketplace-checkout.png", fullPage: true });
  await buyer.getByRole("button", { name: "Перейти к проверке" }).click();
  await expect(buyer.getByRole("heading", { name: "Проверьте заказ" })).toBeVisible();
  await buyer.getByRole("button", { name: "Сформировать счёт", exact: true }).click();
  await expect(buyer.getByRole("heading", { name: "Ваш счёт готов" })).toBeVisible();
  await expect(
    buyer.getByText("Заказ сохранён. Формирование счёта не подтверждает оплату."),
  ).toBeVisible();
  await buyer.screenshot({ path: out + "/marketplace-invoice.png", fullPage: true });
  const pdfDownload = buyer.waitForEvent("download");
  await buyer.getByRole("link", { name: "Скачать PDF", exact: true }).click();
  expect((await pdfDownload).suggestedFilename()).toContain(".pdf");
  await seller.getByRole("link", { name: "Логистика и продажи", exact: true }).click();
  await expect(seller.getByRole("cell", { name: /Светильник 000/ })).toBeVisible();
  await seller.screenshot({ path: out + "/supplier-orders.png", fullPage: true });
  await seller.getByRole("button", { name: /Контакты ·/ }).click();
  await seller.getByRole("button", { name: "Добавить контакт", exact: true }).click();
  await seller.getByLabel("Имя", { exact: true }).fill("Запрос клиента");
  await seller.getByLabel("Email", { exact: true }).fill("client@example.test");
  await seller.getByLabel("Заметка", { exact: true }).fill("Уточнить сроки поставки");
  await seller.getByRole("button", { name: "Сохранить", exact: true }).click();
  await expect(seller.getByRole("cell", { name: "Запрос клиента", exact: true })).toBeVisible();
  await seller.getByRole("link", { name: "Обзор", exact: true }).click();
  await expect(seller.getByRole("heading", { name: "Обзор для руководства" })).toBeVisible();
  await expect(seller.locator(".seller-kpi").first()).toContainText("110");
  await seller.screenshot({ path: out + "/supplier-dashboard.png", fullPage: true });
  await seller.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    seller.getByRole("heading", { name: "Executive overview", exact: true }),
  ).toBeVisible();
  await seller.getByRole("button", { name: "$ USD", exact: true }).click();
  await expect(seller.locator(".seller-kpi").filter({ hasText: "Invoiced amount" })).toContainText(
    "$25.00",
  );
  await seller.screenshot({ path: out + "/supplier-english.png", fullPage: true });
  await seller.getByRole("button", { name: "RU", exact: true }).click();
  await seller.getByRole("button", { name: "₸ KZT", exact: true }).click();
  await buyer.getByRole("button", { name: "EN", exact: true }).click();
  await expect(
    buyer.getByRole("heading", { name: "Your invoice is ready", exact: true }),
  ).toBeVisible();
  await buyer.getByRole("button", { name: "RU", exact: true }).click();
  await seller.setViewportSize({ width: 390, height: 844 });
  await seller.evaluate(() => window.scrollTo(0, 0));
  await seller.screenshot({ path: out + "/supplier-mobile.png", fullPage: true });
  expect(
    await seller.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await buyer.setViewportSize({ width: 390, height: 844 });
  await buyer.evaluate(() => window.scrollTo(0, 0));
  await buyer.screenshot({ path: out + "/marketplace-mobile.png", fullPage: true });

  expect(
    await buyer.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).toBe(true);
  await seller.route("**/api/supplier/analytics", (route) => route.abort());
  await seller.reload();
  await expect(
    seller.getByRole("alert").filter({ hasText: "Нет соединения с сервером" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await supplierContext.close();
  await customerContext.close();
});
