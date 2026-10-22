import PDFDocument from "pdfkit";
import { fileURLToPath } from "node:url";
const regular = fileURLToPath(new URL("./fonts/NotoSans-Regular.ttf", import.meta.url));
const bold = fileURLToPath(new URL("./fonts/NotoSans-Bold.ttf", import.meta.url));
const money = (n) =>
  `${(n / 100).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KZT`;
export async function invoicePdf(invoice) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 44,
    bufferPages: true,
    info: { Title: `Счёт ${invoice.number}`, Author: "AGAS" },
  });
  const chunks = [];
  const result = new Promise((resolve, reject) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  doc.registerFont("Regular", regular);
  doc.registerFont("Bold", bold);
  doc.font("Regular");
  const label = (s) => doc.font("Bold").fontSize(9).fillColor("#62746D").text(s).moveDown(0.6);
  doc.roundedRect(44, 40, 507, 104, 12).fill("#315B80");
  doc.font("Bold").fontSize(24).fillColor("white").text("AGAS", 64, 60);
  doc.font("Regular").fontSize(10).text("СЧЁТ НА ОПЛАТУ", 64, 99);
  doc.font("Bold").fontSize(17).text(invoice.number, 295, 64, { width: 235, align: "right" });
  doc
    .font("Regular")
    .fontSize(10)
    .text(
      new Date(invoice.createdAt).toLocaleDateString("ru-RU", { timeZone: "Asia/Qyzylorda" }),
      295,
      100,
      { width: 235, align: "right" },
    );
  doc.y = 166;
  doc.x = 44;
  doc.fontSize(10).fillColor("#9A6500").text("ОЖИДАЕТ ОПЛАТЫ  ·  Версия 1");
  doc.moveDown(1.4);
  label("ПРОДАВЕЦ");
  doc.font("Bold").fontSize(12).fillColor("#315B80").text(invoice.seller.name);
  doc.font("Regular").fontSize(10).fillColor("#263A32").text(invoice.seller.address);
  doc.text(`БИН: ${invoice.seller.bin}`);
  doc.text(`Банк: ${invoice.seller.bank}`);
  doc.text(`IBAN: ${invoice.seller.iban}    БИК: ${invoice.seller.bik}`);
  doc.moveDown(1);
  label("ПОКУПАТЕЛЬ");
  const b = invoice.buyer;
  doc
    .font("Bold")
    .fontSize(12)
    .fillColor("#315B80")
    .text(b.kind === "company" ? b.companyName : b.name);
  doc.font("Regular").fontSize(10).fillColor("#263A32");
  if (b.bin) doc.text(`БИН: ${b.bin}`);
  doc.text(`${b.postalCode}, Казахстан, ${b.city}, ${b.address}`);
  doc.text(`${b.name}  ·  ${b.phone}  ·  ${b.email}`);
  if (b.iban) doc.text(`IBAN: ${b.iban}  ${b.bank || ""}  ${b.bik || ""}`);
  doc.moveDown(1.5);
  const header = () => {
    const y = doc.y;
    doc.rect(44, y, 507, 28).fill("#EDF2F6");
    doc.fillColor("#315B80").font("Bold").fontSize(9);
    doc.text("ПОЗИЦИЯ / АРТИКУЛ", 54, y + 9, { width: 240 });
    doc.text("КОЛ.", 302, y + 9, { width: 40, align: "right" });
    doc.text("ЦЕНА", 353, y + 9, { width: 85, align: "right" });
    doc.text("СУММА", 445, y + 9, { width: 96, align: "right" });
    doc.y = y + 38;
  };
  header();
  for (const l of invoice.lines) {
    doc.font("Regular").fontSize(10);
    const height = Math.max(44, doc.heightOfString(l.name, { width: 238 }) + 28);
    if (doc.y + height > 725) {
      doc.addPage();
      header();
    }
    const y = doc.y;
    doc.fillColor("#315B80").text(l.name, 54, y, { width: 238 });
    doc
      .fontSize(8)
      .fillColor("#63746B")
      .text(l.sku, 54, y + height - 20, { width: 238 });
    doc
      .fontSize(10)
      .fillColor("#315B80")
      .text(String(l.quantity), 302, y, { width: 40, align: "right" });
    doc.text(money(l.unitMinor), 346, y, { width: 92, align: "right" });
    doc.text(money(l.totalMinor), 440, y, { width: 101, align: "right" });
    doc
      .moveTo(44, y + height - 5)
      .lineTo(551, y + height - 5)
      .strokeColor("#DFE7E0")
      .stroke();
    doc.y = y + height;
    doc.x = 44;
  }
  if (doc.y > 565) doc.addPage();
  doc.moveDown();
  for (const [l, v] of [
    ["Товары", money(invoice.subtotalMinor)],
    ["Доставка", money(invoice.deliveryMinor)],
    [invoice.vatLabel, money(invoice.taxMinor)],
  ]) {
    const y = doc.y;
    doc.font("Regular").fontSize(10).fillColor("#52685C").text(l, 250, y, { width: 195 });
    doc.text(v, 445, y, { width: 106, align: "right" });
    doc.y = y + 22;
  }
  const y = doc.y + 8;
  doc.roundedRect(250, y, 301, 48, 8).fill("#315B80");
  doc
    .font("Bold")
    .fontSize(12)
    .fillColor("white")
    .text("ИТОГО К ОПЛАТЕ", 264, y + 17, { width: 133 });
  doc.fontSize(14).text(money(invoice.totalMinor), 395, y + 15, { width: 142, align: "right" });
  doc.x = 44;
  doc.y = y + 70;
  doc
    .font("Regular")
    .fontSize(9)
    .fillColor("#52685C")
    .text(
      `Способ получения: ${invoice.delivery === "pickup" ? "самовывоз" : "курьерская доставка"}.`,
    );
  doc
    .moveDown(0.5)
    .text(
      "Формирование счёта не подтверждает оплату. Счёт не является электронной счёт-фактурой (ЭСФ). Подпись и печать не проставлены.",
    );
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Regular")
      .fontSize(8)
      .fillColor("#64786C")
      .text(`AGAS  /  ${invoice.number}  /  ${i + 1} из ${pages.count}`, 44, 786, {
        width: 507,
        align: "center",
        lineBreak: false,
      });
  }
  doc.end();
  return result;
}
