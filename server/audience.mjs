import { hash } from "./domain.mjs";

const dayMs = 86400000;
const sum = (rows, field) => rows.reduce((total, row) => total + row[field], 0);

export function audienceAnalytics(all, supplierId, days, now = Date.now()) {
  const day = (offset) => new Date(now + 5 * 3600000 + offset * dayMs).toISOString().slice(0, 10);
  const from = day(1 - days),
    to = day(0);
  const timestamp = (offset) =>
    new Date(Date.parse(`${day(offset)}T00:00:00+05:00`))
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  const invoices = all(
    `
    SELECT date(i.created_at,'+5 hours') AS day,i.user_id,i.status,
           sum(l.quantity) AS units,sum(l.total_minor) AS totalMinor,
           u.email LIKE '%@guest.invalid' AS guest
    FROM order_lines l JOIN invoices i ON i.id=l.invoice_id JOIN users u ON u.id=i.user_id
    WHERE l.supplier_id=? AND i.created_at>=? AND i.created_at<?
    GROUP BY i.id ORDER BY i.created_at DESC`,
    supplierId,
    timestamp(1 - days),
    timestamp(1),
  );
  const buyers = new Map();
  const series = Array.from({ length: days }, (_, index) => ({
    day: day(1 - days + index),
    invoices: 0,
    paid: 0,
    views: 0,
    carts: 0,
    favorites: 0,
  }));
  const byDay = new Map(series.map((point) => [point.day, point]));
  for (const invoice of invoices) {
    const point = byDay.get(invoice.day);
    const paid = invoice.status === "paid";
    point.invoices++;
    point.paid += Number(paid);
    const customer = buyers.get(invoice.user_id) || {
      reference: hash(`${supplierId}:${invoice.user_id}`).slice(0, 10).toUpperCase(),
      guest: Boolean(invoice.guest),
      invoices: 0,
      units: 0,
      invoicedMinor: 0,
      paidUnits: 0,
      paidMinor: 0,
      lastOrder: invoice.day,
    };
    customer.invoices++;
    customer.units += invoice.units;
    customer.invoicedMinor += invoice.totalMinor;
    if (paid) {
      customer.paidUnits += invoice.units;
      customer.paidMinor += invoice.totalMinor;
    }
    buyers.set(invoice.user_id, customer);
  }
  const metric = { view: "views", cart: "carts", favorite: "favorites" };
  const totals = { views: 0, carts: 0, favorites: 0 };
  const categories = new Map();
  const interest = all(
    `
    SELECT e.day,e.kind,sum(e.count) AS count,json_extract(p.data,'$.category') AS category
    FROM catalog_interest e JOIN products p ON p.id=e.product_id AND p.supplier_id=e.supplier_id
    WHERE e.supplier_id=? AND e.day BETWEEN ? AND ? GROUP BY e.day,e.kind,category`,
    supplierId,
    from,
    to,
  );
  for (const event of interest) {
    const key = metric[event.kind];
    const category = categories.get(event.category) || {
      category: event.category,
      views: 0,
      carts: 0,
      favorites: 0,
    };
    category[key] += event.count;
    byDay.get(event.day)[key] += event.count;
    totals[key] += event.count;
    categories.set(event.category, category);
  }
  const customers = [...buyers.values()];
  const paid = invoices.filter((invoice) => invoice.status === "paid");
  return {
    from,
    to,
    series,
    summary: {
      ...totals,
      customers: customers.length,
      repeatCustomers: customers.filter((buyer) => buyer.invoices > 1).length,
      invoices: invoices.length,
      invoicedMinor: sum(invoices, "totalMinor"),
      paid: paid.length,
      paidUnits: sum(paid, "units"),
      paidMinor: sum(paid, "totalMinor"),
    },
    customers: customers.sort((a, b) => b.invoicedMinor - a.invoicedMinor),
    categories: [...categories.values()].sort((a, b) => b.views - a.views || b.carts - a.carts),
  };
}
