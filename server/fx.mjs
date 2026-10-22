let cache = null,
  expires = 0,
  pending = null;
export function parseUsd(xml) {
  const item = (xml.match(/<item>[\s\S]*?<\/item>/g) || []).find((v) =>
    /<title>\s*USD\s*<\/title>/.test(v),
  );
  if (!item) throw Error("USD not found");
  const read = (tag) =>
    item
      .match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`))?.[1]
      ?.replace(/<!\[CDATA\[|\]\]>/g, "")
      .trim();
  const units = Number(read("quant") || 1),
    value = Number(read("description")?.replace(",", ".")) / units;
  const date = read("pubDate");
  if (!date || !/^\d{2}\.\d{2}\.\d{4}$/.test(date) || !Number.isFinite(value) || value <= 0)
    throw Error("Invalid FX feed");
  return {
    kztPerUsd: value,
    asOf: date,
    source: "Национальный Банк Казахстана",
    sourceUrl: "https://nationalbank.kz/ru/page/rss",
    stale: false,
  };
}
export async function exchangeRate() {
  if (Date.now() < expires) return cache;
  if (pending) return pending;
  pending = (async () => {
    try {
      const response = await fetch("https://nationalbank.kz/rss/rates_all.xml", {
        signal: AbortSignal.timeout(6000),
      });
      if (!response.ok) throw Error("FX unavailable");
      const xml = await response.text();
      if (xml.length > 200000) throw Error("FX feed too large");
      cache = parseUsd(xml);
      expires = Date.now() + 3600000;
      return cache;
    } catch {
      expires = Date.now() + 60000;
      cache = cache ? { ...cache, stale: true } : null;
      return cache;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
