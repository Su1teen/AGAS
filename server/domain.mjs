import { z } from "zod";
import { createHash, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

export const fail = (message, status = 400) => {
  const e = new Error(message);
  e.status = status;
  throw e;
};
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export function passwordHash(password) {
  const salt = randomUUID();
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function passwordValid(password, stored) {
  const [salt, key] = stored.split(":");
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(key, "hex"));
}
const text = (min = 1, max = 250) => z.string().trim().min(min).max(max);
export const credentials = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(12).max(128),
});
export const register = credentials.extend({
  name: text(2, 120),
  kind: z.enum(["buyer", "supplier"]),
  company: text(2, 120).optional(),
});
export const buyer = z
  .object({
    kind: z.enum(["individual", "company"]),
    name: text(2, 160),
    email: z.string().trim().email().max(254),
    phone: z.string().regex(/^\+7\d{10}$/, "Телефон в формате +7XXXXXXXXXX"),
    address: text(5, 400),
    city: text(2, 120),
    postalCode: z
      .string()
      .trim()
      .regex(/^(\d{6}|[A-Z0-9]{7})$/, "Проверьте индекс Казахстана"),
    country: z.literal("KZ"),
    bin: z
      .string()
      .regex(/^\d{12}$/, "БИН должен содержать 12 цифр")
      .optional(),
    companyName: text(2, 200).optional(),
    bank: text(2, 200).optional(),
    iban: z
      .string()
      .regex(/^KZ[A-Z0-9]{18}$/, "IBAN: KZ и 18 символов")
      .optional(),
    bik: z
      .string()
      .regex(/^[A-Z0-9]{8}(?:[A-Z0-9]{3})?$/, "Проверьте БИК")
      .optional(),
  })
  .superRefine((b, ctx) => {
    if (b.kind === "company" && (!b.bin || !b.companyName))
      ctx.addIssue({ code: "custom", message: "Укажите название организации и БИН" });
  });
export const checkout = z
  .object({
    buyer,
    delivery: z.enum(["pickup", "courier"]),
    items: z
      .array(
        z.object({ productId: text(1, 120), quantity: z.number().int().min(1).max(999) }).strict(),
      )
      .min(1)
      .max(200),
  })
  .strict();
export const product = z
  .object({
    sku: text(1, 100).transform((s) => s.normalize("NFKC").toUpperCase()),
    name: text(2, 180),
    category: text(1, 120),
    description: z.string().trim().max(4000).default(""),
    brand: z.string().trim().max(120).default(""),
    price: z
      .number()
      .finite()
      .min(0.01)
      .max(100000000)
      .refine(
        (v) => Math.abs(v * 100 - Math.round(v * 100)) < 0.00001,
        "Не более двух знаков после запятой",
      ),
    stock: z.number().int().min(0).max(10000000),
    image: z.string().max(3000000).default(""),
    iso: z.string().max(200).default(""),
    document: z.string().max(2048).default(""),
    invoiceRef: z.string().max(150).default(""),
  })
  .strict();
export function safeImage(value) {
  if (!value) return "";
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value)) return value;
  try {
    const u = new URL(value);
    if (u.protocol === "https:" && !u.username && !u.password) return u.href;
  } catch {
    /* handled below */
  }
  fail("Изображение: используйте HTTPS URL либо PNG/JPEG/WebP из XLSX");
}
export function validateProduct(input) {
  const p = product.parse(input);
  p.image = safeImage(p.image);
  if (p.document) {
    try {
      const u = new URL(p.document);
      if (u.protocol !== "https:" || u.username || u.password) throw Error();
    } catch {
      fail("Документ: требуется ссылка HTTPS");
    }
  }
  return p;
}
export const fields = {
  sku: "Артикул",
  name: "Название",
  category: "Категория",
  description: "Описание",
  brand: "Бренд",
  price: "Цена, KZT",
  stock: "Остаток",
  image: "Изображение",
  iso: "ISO / сертификат",
  document: "Документ, URL",
  invoiceRef: "Номер документа поставки",
};
export function mapRows(payload, mapping) {
  const required = ["sku", "name", "category", "price", "stock"];
  for (const key of required)
    if (!Object.values(mapping).includes(key)) fail(`Назначьте колонку «${fields[key]}»`);
  const assignments = Object.values(mapping).filter(Boolean);
  if (new Set(assignments).size !== assignments.length)
    fail("Одно поле нельзя назначить двум колонкам");
  const seen = new Set();
  return payload.rows.map((row, i) => {
    const data = {
      description: "",
      brand: "",
      image: payload.images?.[i + 2] || "",
      iso: "",
      document: "",
      invoiceRef: "",
    };
    for (const [column, field] of Object.entries(mapping)) {
      if (!Object.hasOwn(fields, field)) continue;
      const v = row[Number(column)];
      if (v !== "" && v != null) data[field] = v;
    }
    for (const key of ["price", "stock"]) {
      const raw = String(data[key] ?? "")
        .trim()
        .replace(/[\s\u00a0]/g, "")
        .replace(",", ".");
      data[key] = raw === "" ? NaN : Number(raw);
    }
    try {
      const value = validateProduct(data);
      if (seen.has(value.sku)) fail("Артикул повторяется в файле");
      seen.add(value.sku);
      return { row: i + 2, value, errors: [] };
    } catch (e) {
      return {
        row: i + 2,
        value: null,
        errors: e.issues?.map((x) => `${fields[x.path[0]] || x.path[0]}: ${x.message}`) || [
          e.message,
        ],
      };
    }
  });
}
export function quote(input, lookup, config) {
  const grouped = new Map();
  for (const i of input.items)
    grouped.set(i.productId, (grouped.get(i.productId) || 0) + i.quantity);
  const lines = [...grouped].map(([id, quantity]) => {
    const p = lookup(id);
    if (!p || !p.published) fail("Товар недоступен. Обновите корзину", 409);
    if (quantity > p.stock || quantity > 999) fail(`Недостаточно товара: ${p.name}`, 409);
    return {
      productId: id,
      supplierId: p.supplier_id,
      sku: p.sku,
      name: p.name,
      quantity,
      unitMinor: p.price_minor,
      totalMinor: p.price_minor * quantity,
    };
  });
  const subtotal = lines.reduce((sum, l) => sum + l.totalMinor, 0);
  const delivery = input.delivery === "courier" ? config.deliveryMinor : 0;
  const tax = config.vatRate === null ? 0 : Math.round((subtotal * config.vatRate) / 100);
  if (!Number.isSafeInteger(subtotal + delivery + tax)) fail("Превышена допустимая сумма");
  return {
    lines,
    subtotalMinor: subtotal,
    deliveryMinor: delivery,
    taxMinor: tax,
    totalMinor: subtotal + delivery + tax,
    currency: "KZT",
    vatRate: config.vatRate,
    vatLabel:
      config.vatRate === null ? "НДС не указан продавцом" : `НДС ${config.vatRate}% сверх цены`,
    delivery: input.delivery,
  };
}
