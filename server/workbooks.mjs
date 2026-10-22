import ExcelJS from "exceljs";
import AdmZip from "adm-zip";
import { parse } from "csv-parse/sync";
import { fail, fields } from "./domain.mjs";

const MAX_ROWS = 5000;
export async function readUpload(buffer, name, sheetIndex = 0) {
  if (buffer.length > 10 * 1024 * 1024) fail("Размер файла не более 10 МБ");
  let rows = [],
    images = {},
    sheets = [];
  if (/\.csv$/i.test(name)) {
    const source = buffer.toString("utf8").replace(/^\uFEFF/, "");
    const first = source.split(/\r?\n/)[0];
    rows = parse(source, {
      delimiter: first.split(";").length > first.split(",").length ? ";" : ",",
      bom: true,
      skip_empty_lines: true,
      relax_column_count: true,
      max_record_size: 50000,
    });
    sheets = ["CSV"];
  } else if (/\.xlsx$/i.test(name)) {
    // Validate central-directory sizes before ExcelJS inflates the archive.
    const entries = new AdmZip(buffer).getEntries();
    let inflated = 0;
    if (entries.length > 3000) fail("Слишком много объектов в XLSX");
    for (const e of entries) {
      inflated += e.header.size;
      if (e.header.size > 20 * 1024 * 1024 || inflated > 50 * 1024 * 1024)
        fail("Распакованный XLSX превышает 50 МБ");
      if (/vbaProject|externalLinks/i.test(e.entryName))
        fail("Макросы и внешние связи не поддерживаются");
    }
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    sheets = wb.worksheets.map((s) => s.name);
    const ws = wb.worksheets[sheetIndex];
    if (!ws) fail("Лист не найден");
    if (ws.rowCount > MAX_ROWS + 1 || ws.columnCount > 80) fail("Лимит: 5000 строк и 80 колонок");
    const cellText = (c) => {
      const v = c.value;
      if (v == null) return "";
      if (typeof v === "object") {
        if (v.formula || v.sharedFormula) return "[ФОРМУЛА НЕ ПОДДЕРЖИВАЕТСЯ]";
        if (v.hyperlink) return String(v.hyperlink);
        if (v.richText) return v.richText.map((t) => t.text).join("");
        if (v instanceof Date) return v.toISOString();
        if (v.error) return "[ОШИБКА ЯЧЕЙКИ]";
        return String(v.text ?? "");
      }
      return String(v);
    };
    for (let r = 1; r <= ws.rowCount; r++) {
      const row = [];
      for (let c = 1; c <= ws.columnCount; c++) row.push(cellText(ws.getCell(r, c)));
      rows.push(row);
    }
    let imageBytes = 0;
    for (const item of ws.getImages()) {
      const img = wb.getImage(item.imageId);
      if (!img?.buffer || !["png", "jpeg", "jpg", "webp"].includes(img.extension)) continue;
      const bytes = Buffer.from(img.buffer);
      imageBytes += bytes.length;
      if (bytes.length > 2 * 1024 * 1024 || imageBytes > 8 * 1024 * 1024)
        fail("Изображения: до 2 МБ каждое, до 8 МБ суммарно");
      const row = item.range.tl.nativeRow + 1;
      if (images[row]) fail(`Строка ${row}: поддерживается одно встроенное изображение`);
      const png = bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a";
      const jpg = bytes[0] === 255 && bytes[1] === 216;
      const webp =
        bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
      if (!png && !jpg && !webp) fail("Некорректный формат изображения");
      images[row] =
        `data:image/${png ? "png" : jpg ? "jpeg" : "webp"};base64,${bytes.toString("base64")}`;
    }
  } else fail("Выберите XLSX или CSV в UTF-8. XLS не поддерживается");
  if (rows.length < 2 || rows.length > MAX_ROWS + 1 || rows.some((r) => r.length > 80))
    fail("Нужно от 1 до 5000 строк и не более 80 колонок");
  const headers = rows.shift().map((s, i) => String(s || `Колонка ${i + 1}`).slice(0, 200));
  return { headers, rows, images, sheets, sheetIndex };
}
export async function workbook(title, headers, rows) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AGAS";
  const ws = wb.addWorksheet(title.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
    pageSetup: { orientation: "landscape", fitToPage: true },
  });
  ws.columns = headers.map((h) => ({ header: h, width: Math.min(48, Math.max(18, h.length + 4)) }));
  for (const row of rows)
    ws.addRow(row.map((v) => (typeof v === "string" && /^[=+@-]/.test(v) ? `'${v}` : v)));
  ws.autoFilter = { from: "A1", to: { row: 1, column: headers.length } };
  ws.getRow(1).height = 32;
  ws.getRow(1).eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF173B36" } };
    c.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
  });
  ws.eachRow((row, i) => {
    if (i > 1) {
      row.height = 30;
      row.eachCell((c) => {
        c.font = { name: "Arial", size: 11 };
        c.alignment = { vertical: "middle", wrapText: true };
        if (i % 2 === 0)
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F6F3" } };
      });
    }
  });
  return Buffer.from(await wb.xlsx.writeBuffer());
}
export const template = () =>
  workbook("Товары", Object.values(fields), [
    ["SKU-001", "Название товара", "Освещение", "Описание", "Бренд", 10000, 100, "", "", "", ""],
  ]);
