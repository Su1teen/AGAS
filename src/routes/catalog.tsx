// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Container } from "@/components/site/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { useProducts } from "@/lib/catalog";
import { catalogGroups, categories } from "@/data/categories";
export const Route = createFileRoute("/catalog")({
  head: () => ({
    meta: [
      { title: "Каталог · AGAS" },
      {
        name: "description",
        content: "Полный каталог устройств умного дома: освещение, акустика, климат, безопасность.",
      },
      { property: "og:title", content: "Каталог · AGAS" },
    ],
  }),
  component: CatalogPage,
});
type Sort = "popular" | "price-asc" | "price-desc" | "new";
type Budget = "all" | "under-50" | "50-150" | "150-plus";
function CatalogPage() {
  useUi();
  const { products } = useProducts();
  const [group, setGroup] = useState<string | null>(null);
  const [cat, setCat] = useState<string | null>(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<string | null>(null);
  const [functionality, setFunctionality] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget>("all");
  const [sort, setSort] = useState<Sort>("popular");
  const [inStockOnly, setInStockOnly] = useState(false);
  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);
  const protocols = useMemo(
    () => [...new Set(products.flatMap((p) => p.protocols))].sort(),
    [products],
  );
  const functions = useMemo(
    () => [...new Set(products.flatMap((p) => p.functions))].sort(),
    [products],
  );
  const visibleCategories = useMemo(
    () => categories.filter((category) => !group || category.group === group),
    [group],
  );
  const list = useMemo(() => {
    let arr = [...products];
    if (group) arr = arr.filter((p) => p.group === group);
    if (cat) arr = arr.filter((p) => p.category === cat);
    if (brand) arr = arr.filter((p) => p.brand === brand);
    if (protocol) arr = arr.filter((p) => p.protocols.includes(protocol));
    if (functionality) arr = arr.filter((p) => p.functions.includes(functionality));
    if (budget === "under-50") arr = arr.filter((p) => p.price < 50000);
    if (budget === "50-150") arr = arr.filter((p) => p.price >= 50000 && p.price <= 150000);
    if (budget === "150-plus") arr = arr.filter((p) => p.price > 150000);
    if (inStockOnly) arr = arr.filter((p) => p.inStock);
    switch (sort) {
      case "price-asc":
        arr.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        arr.sort((a, b) => b.price - a.price);
        break;
      case "new":
        arr.sort((a, b) => Number(b.isNew ?? 0) - Number(a.isNew ?? 0));
        break;
      default:
        arr.sort((a, b) => b.rating - a.rating);
    }
    return arr;
  }, [brand, budget, cat, functionality, group, inStockOnly, protocol, sort, products]);
  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-12 flex flex-col gap-3 border-b border-border pb-10">
          <span className="eyebrow">{tr("Каталог")}</span>
          <h1 className="font-serif text-5xl leading-[1.05] text-foreground md:text-6xl">
            {tr("Все устройства AGAS")}
          </h1>
          <p className="max-w-[52ch] text-base text-ink-soft text-pretty">
            {tr(
              "Полный ассортимент премиальной экосистемы: B2C-устройства для дома и B2B-инфраструктура для профессиональных инсталляций.",
            )}
          </p>
        </div>

        <div className="flex flex-col gap-12 lg:flex-row">
          <aside className="w-full lg:w-64 lg:shrink-0">
            <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-4 lg:pb-8">
              <div className="mb-8">
                <h4 className="eyebrow mb-4">{tr("Группа")}</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setGroup(null);
                      setCat(null);
                    }}
                    data-active={!group}
                    className="text-left text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:font-medium data-[active=true]:text-foreground"
                  >
                    {tr("Все направления")}
                  </button>
                  {tr(
                    catalogGroups.map((item) => (
                      <button
                        key={item.slug}
                        onClick={() => {
                          setGroup(item.slug);
                          setCat(null);
                        }}
                        data-active={group === item.slug}
                        className="text-left text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:font-medium data-[active=true]:text-foreground"
                      >
                        {tr(item.title)}
                      </button>
                    )),
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="eyebrow mb-4">{tr("Сортировка")}</h4>
                <div className="flex flex-col gap-2">
                  {tr(
                    (
                      [
                        ["popular", "Популярное"],
                        ["new", "Сначала новые"],
                        ["price-asc", "Цена: по возрастанию"],
                        ["price-desc", "Цена: по убыванию"],
                      ] as [Sort, string][]
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setSort(key)}
                        data-active={sort === key}
                        className="text-left text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:text-foreground data-[active=true]:font-medium"
                      >
                        {tr(label)}
                      </button>
                    )),
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="eyebrow mb-4">{tr("Категории")}</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setCat(null)}
                    data-active={!cat}
                    className="text-left text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:text-foreground data-[active=true]:font-medium"
                  >
                    {tr("Все")}
                  </button>
                  {tr(
                    visibleCategories.map((c) => (
                      <button
                        key={c.slug}
                        onClick={() => setCat(c.slug)}
                        data-active={cat === c.slug}
                        className="text-left text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:text-foreground data-[active=true]:font-medium"
                      >
                        {tr(c.title)}
                      </button>
                    )),
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="eyebrow mb-4">{tr("Бренды")}</h4>
                <div className="flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
                  <button
                    onClick={() => setBrand(null)}
                    data-active={!brand}
                    className="text-left text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:font-medium data-[active=true]:text-foreground"
                  >
                    {tr("Все бренды")}
                  </button>
                  {tr(
                    brands.map((item) => (
                      <button
                        key={item}
                        onClick={() => setBrand(item)}
                        data-active={brand === item}
                        className="text-left text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:font-medium data-[active=true]:text-foreground"
                      >
                        {tr(item)}
                      </button>
                    )),
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="eyebrow mb-4">{tr("Протоколы")}</h4>
                <div className="flex flex-wrap gap-2">
                  {tr(
                    ["Все", ...protocols].map((item) => {
                      const value = item === "Все" ? null : item;
                      return (
                        <button
                          key={item}
                          onClick={() => setProtocol(value)}
                          data-active={protocol === value}
                          className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft transition-colors hover:text-foreground data-[active=true]:border-foreground data-[active=true]:text-foreground"
                        >
                          {tr(item)}
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="eyebrow mb-4">{tr("Функционал")}</h4>
                <div className="flex flex-wrap gap-2">
                  {tr(
                    ["Все", ...functions.slice(0, 18)].map((item) => {
                      const value = item === "Все" ? null : item;
                      return (
                        <button
                          key={item}
                          onClick={() => setFunctionality(value)}
                          data-active={functionality === value}
                          className="rounded-full border border-border px-3 py-1.5 text-xs text-ink-soft transition-colors hover:text-foreground data-[active=true]:border-foreground data-[active=true]:text-foreground"
                        >
                          {tr(item)}
                        </button>
                      );
                    }),
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="eyebrow mb-4">{tr("Бюджет")}</h4>
                <div className="flex flex-col gap-2">
                  {tr(
                    (
                      [
                        ["all", "Любой бюджет"],
                        ["under-50", "до 50 000 ₸"],
                        ["50-150", "50 000–150 000 ₸"],
                        ["150-plus", "от 150 000 ₸"],
                      ] as [Budget, string][]
                    ).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setBudget(key)}
                        data-active={budget === key}
                        className="text-left text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:font-medium data-[active=true]:text-foreground"
                      >
                        {tr(label)}
                      </button>
                    )),
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h4 className="eyebrow mb-4">{tr("Наличие")}</h4>
                <label className="flex cursor-pointer items-center gap-3 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="size-4 accent-foreground"
                  />
                  {tr("Только в наличии")}
                </label>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-8 flex flex-wrap items-center gap-2">
              {tr(
                [group, cat, brand, protocol, functionality, budget !== "all" ? budget : null]
                  .filter(Boolean)
                  .map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft"
                    >
                      {tr(item)}
                    </span>
                  )),
              )}
              {tr(
                (group || cat || brand || protocol || functionality || budget !== "all") && (
                  <button
                    onClick={() => {
                      setGroup(null);
                      setCat(null);
                      setBrand(null);
                      setProtocol(null);
                      setFunctionality(null);
                      setBudget("all");
                    }}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {tr("Сбросить фильтры")}
                  </button>
                ),
              )}
            </div>
            {tr(
              list.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-16 text-center">
                  <p className="text-sm text-ink-soft">
                    {tr("Ничего не найдено. Попробуйте сбросить фильтры.")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {tr(list.map((p) => <ProductCard key={p.id} product={p} />))}
                </div>
              ),
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}
