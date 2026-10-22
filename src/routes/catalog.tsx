import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Container } from "@/components/site/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { useProducts } from "@/lib/catalog";
import { categories } from "@/data/categories";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, X, ArrowLeft } from "lucide-react";

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
  const { products, loading } = useProducts();
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

  const list = useMemo(() => {
    let arr = [...products];
    if (cat && cat !== "all-products") arr = arr.filter((p) => p.category === cat);
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
  }, [brand, budget, cat, functionality, inStockOnly, protocol, sort, products]);

  const activeCategory = useMemo(() => categories.find((c) => c.slug === cat), [cat]);

  const hasActiveFilters =
    brand || protocol || functionality || budget !== "all" || inStockOnly || sort !== "popular";

  const clearFilters = () => {
    setBrand(null);
    setProtocol(null);
    setFunctionality(null);
    setBudget("all");
    setSort("popular");
    setInStockOnly(false);
  };

  return (
    <div className="min-h-screen pb-24 pt-8">
      <Container>
        {/* Top Horizontal Category Tabs */}
        <div className="mb-10 flex w-full items-center gap-3 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setCat(null)}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              !cat
                ? "bg-foreground text-background"
                : "border border-border bg-transparent text-ink-soft hover:text-foreground"
            }`}
          >
            {tr("Все категории")}
          </button>
          <button
            disabled={loading}
            onClick={() => setCat("all-products")}
            className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              cat === "all-products"
                ? "bg-foreground text-background"
                : "border border-border bg-transparent text-ink-soft hover:text-foreground"
            }`}
          >
            {tr("Все товары")}
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCat(c.slug)}
              className={`shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                cat === c.slug
                  ? "bg-foreground text-background"
                  : "border border-border bg-transparent text-ink-soft hover:text-foreground"
              }`}
            >
              {tr(c.shortTitle)}
            </button>
          ))}
        </div>

        {!cat ? (
          /* When NO category selected — Large Category Cards Grid */
          <div>
            <div className="mb-12 flex flex-col gap-4">
              <span className="eyebrow">{tr("Каталог")}</span>
              <h1 className="font-serif text-5xl leading-[1.05] text-foreground md:text-6xl">
                {tr("Все устройства AGAS")}
              </h1>
              <p className="max-w-[52ch] text-base text-ink-soft text-pretty">
                {tr(
                  "Полный ассортимент премиальной экосистемы: устройства для дома и инфраструктура для профессиональных инсталляций.",
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const count = products.filter((p) => p.category === category.slug).length;
                return (
                  <Link
                    key={category.slug}
                    to="/category/$slug"
                    params={{ slug: category.slug }}
                    className="group relative flex h-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-background p-0 transition-transform duration-500 hover:-translate-y-1"
                  >
                    <div className="flex flex-col gap-2 p-6 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="eyebrow">
                          {tr(count)}
                          {tr("товаров")}
                        </span>
                      </div>
                      <h3 className="font-serif text-2xl text-foreground">{tr(category.title)}</h3>
                      <p className="text-sm text-ink-soft">{tr(category.tagline)}</p>
                    </div>
                    <div className="relative mt-auto aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={category.cover}
                        alt={category.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* When a category IS selected — Product Grid with Inline Filters */
          <div>
            <div className="mb-8">
              <button
                onClick={() => setCat(null)}
                className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {tr("Все категории")}
              </button>
              <h2 className="font-serif text-4xl text-foreground md:text-5xl">
                {tr(cat === "all-products" ? "Все товары" : activeCategory?.title)}
              </h2>
            </div>

            {/* Inline Filters */}
            <div className="mb-10 flex flex-wrap items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-ink-soft transition-colors hover:text-foreground">
                    {tr(
                      sort === "popular"
                        ? "Сортировка"
                        : sort === "new"
                          ? "Сначала новые"
                          : sort === "price-asc"
                            ? "Сначала дешевые"
                            : "Сначала дорогие",
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2">
                  <div className="flex flex-col gap-1">
                    {(
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
                        className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          sort === key
                            ? "bg-surface font-medium text-foreground"
                            : "text-ink-soft hover:bg-surface/50 hover:text-foreground"
                        }`}
                      >
                        {tr(label)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-ink-soft transition-colors hover:text-foreground">
                    {tr(brand || "Бренд")}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2 max-h-80 overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setBrand(null)}
                      className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        !brand
                          ? "bg-surface font-medium text-foreground"
                          : "text-ink-soft hover:bg-surface/50 hover:text-foreground"
                      }`}
                    >
                      {tr("Все бренды")}
                    </button>
                    {brands.map((b) => (
                      <button
                        key={b}
                        onClick={() => setBrand(b)}
                        className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          brand === b
                            ? "bg-surface font-medium text-foreground"
                            : "text-ink-soft hover:bg-surface/50 hover:text-foreground"
                        }`}
                      >
                        {tr(b)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-ink-soft transition-colors hover:text-foreground">
                    {tr(protocol || "Протокол")}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2 max-h-80 overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setProtocol(null)}
                      className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        !protocol
                          ? "bg-surface font-medium text-foreground"
                          : "text-ink-soft hover:bg-surface/50 hover:text-foreground"
                      }`}
                    >
                      {tr("Все протоколы")}
                    </button>
                    {protocols.map((p) => (
                      <button
                        key={p}
                        onClick={() => setProtocol(p)}
                        className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          protocol === p
                            ? "bg-surface font-medium text-foreground"
                            : "text-ink-soft hover:bg-surface/50 hover:text-foreground"
                        }`}
                      >
                        {tr(p)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-ink-soft transition-colors hover:text-foreground">
                    {tr(functionality || "Функция")}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2 max-h-80 overflow-y-auto">
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => setFunctionality(null)}
                      className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        !functionality
                          ? "bg-surface font-medium text-foreground"
                          : "text-ink-soft hover:bg-surface/50 hover:text-foreground"
                      }`}
                    >
                      {tr("Все функции")}
                    </button>
                    {functions.map((f) => (
                      <button
                        key={f}
                        onClick={() => setFunctionality(f)}
                        className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          functionality === f
                            ? "bg-surface font-medium text-foreground"
                            : "text-ink-soft hover:bg-surface/50 hover:text-foreground"
                        }`}
                      >
                        {tr(f)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-ink-soft transition-colors hover:text-foreground">
                    {tr(
                      budget === "all"
                        ? "Бюджет"
                        : budget === "under-50"
                          ? "до 50 000 ₸"
                          : budget === "50-150"
                            ? "50 000–150 000 ₸"
                            : "от 150 000 ₸",
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56 p-2">
                  <div className="flex flex-col gap-1">
                    {(
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
                        className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          budget === key
                            ? "bg-surface font-medium text-foreground"
                            : "text-ink-soft hover:bg-surface/50 hover:text-foreground"
                        }`}
                      >
                        {tr(label)}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                  inStockOnly
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-ink-soft hover:text-foreground"
                }`}
              >
                {tr("Только в наличии")}
              </button>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:text-accent"
                >
                  <X className="h-4 w-4" />
                  {tr("Сбросить")}
                </button>
              )}
            </div>

            {list.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-surface/30 py-24 text-center">
                <p className="text-base text-ink-soft mb-4">{tr("Ничего не найдено")}</p>
                <button
                  onClick={clearFilters}
                  className="rounded-full bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-transform hover:scale-105"
                >
                  {tr("Сбросить фильтры")}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
