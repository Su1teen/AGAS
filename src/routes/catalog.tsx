import { tr, useUi } from "@/lib/ui";
import {
  createFileRoute,
  Link,
  stripSearchParams,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Container } from "@/components/site/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { useProducts } from "@/lib/catalog";
import { catalogGroups } from "@/data/categories";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, X, ArrowLeft, Search } from "lucide-react";

export const Route = createFileRoute("/catalog")({
  validateSearch: (search: { q?: string; all?: boolean } & SearchSchemaInput) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 120) : "",
    all: search.all === true,
  }),
  search: { middlewares: [stripSearchParams({ q: "", all: false })] },
  head: () => ({
    meta: [
      { title: "Каталог · AGAS" },
      {
        name: "description",
        content:
          "Товары для детей и родителей, одежда, бытовая техника и оборудование для умного дома.",
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
  const { products, loading, error, reload } = useProducts();
  const { q, all } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [limit, setLimit] = useState(32);
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
    const terms = q.trim().toLowerCase().replaceAll("ё", "е").split(/\s+/).filter(Boolean);
    if (terms.length)
      arr = arr.filter((p) => {
        const text =
          `${p.name} ${p.brand} ${p.categoryLabel} ${p.subcategoryLabel} ${p.specs["Артикул"] || ""}`
            .toLowerCase()
            .replaceAll("ё", "е");
        return terms.every((term) => text.includes(term));
      });
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
  }, [brand, budget, q, functionality, inStockOnly, protocol, sort, products]);

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
        <form
          role="search"
          className="mb-8 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const query = String(new FormData(event.currentTarget).get("q") || "").trim();
            clearFilters();
            setLimit(32);
            void navigate({ search: { q: query, all: !query } });
          }}
        >
          <input
            key={q}
            name="q"
            type="search"
            defaultValue={q}
            maxLength={120}
            aria-label={tr("Поиск товаров")}
            placeholder={tr("Название, бренд или артикул")}
            className="min-w-0 flex-1 rounded-xl border border-border px-4 py-3"
          />
          <button className="flex items-center gap-2 rounded-xl bg-foreground px-4 text-sm text-background">
            <Search size={17} />
            {tr("Найти")}
          </button>
        </form>
        {error && (
          <p className="mb-5 text-sm" role="alert">
            {tr(error)}{" "}
            <button onClick={reload} className="underline">
              {tr("Повторить")}
            </button>
          </p>
        )}

        {!all && !q ? (
          /* When NO category selected — Large Category Cards Grid */
          <div>
            <div className="mb-12 flex flex-col gap-4">
              <h1 className="font-serif text-5xl leading-[1.05] text-foreground md:text-6xl">
                {tr("Каталог AGAS")}
              </h1>
              <p className="max-w-[52ch] text-base text-ink-soft text-pretty">
                {tr("Товары для семьи, бытовая техника и оборудование для умного дома.")}
              </p>
              <Link
                to="/catalog"
                search={{ q: "", all: true }}
                className="w-fit text-sm font-medium underline underline-offset-4"
              >
                {tr("Все товары")}
              </Link>
            </div>

            {catalogGroups.map((group) => (
              <section className="mb-12" key={group.slug}>
                <h2 className="mb-5 font-serif text-3xl">{tr(group.title)}</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {group.categories.map((category) => {
                    const count = products.filter((p) => p.category === category.slug).length;
                    return (
                      <Link
                        key={category.slug}
                        to="/category/$slug"
                        params={{ slug: category.slug }}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-background transition-transform hover:-translate-y-1"
                      >
                        <div className="flex flex-col gap-2 p-4 md:p-5">
                          <div className="flex items-center justify-between">
                            <span className="eyebrow">
                              {!loading && `${count} ${tr("товаров")}`}
                            </span>
                          </div>
                          <h3 className="font-serif text-2xl text-foreground">
                            {tr(category.title)}
                          </h3>
                          <p className="text-sm text-ink-soft">{tr(category.tagline)}</p>
                        </div>
                        <div className="relative mt-auto aspect-[4/3] w-full overflow-hidden bg-white">
                          <img
                            src={category.cover}
                            alt=""
                            loading="lazy"
                            className={`h-full w-full transition-transform duration-500 group-hover:scale-105 ${category.cover.includes("/demo/") ? "object-contain p-3" : "object-cover"}`}
                          />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          /* When a category IS selected — Product Grid with Inline Filters */
          <div>
            <div className="mb-8">
              <Link
                to="/catalog"
                search={{ q: "", all: false }}
                className="mb-6 flex items-center gap-2 text-sm text-ink-soft transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {tr("Все категории")}
              </Link>
              <h1 className="font-serif text-4xl text-foreground md:text-5xl">
                {q ? `${tr("Результаты поиска")} «${q}»` : tr("Все товары")}
              </h1>
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

            {loading && list.length === 0 ? (
              <p role="status">{tr("Загрузка товаров…")}</p>
            ) : list.length === 0 ? (
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
              <>
                <p className="mb-5 text-sm text-ink-soft" role="status">
                  {list.length} {tr("товаров")}
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
                  {list.slice(0, limit).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {list.length > limit && (
                  <button
                    className="mx-auto mt-8 block rounded-full border border-border px-6 py-3 text-sm"
                    onClick={() => setLimit((value) => value + 32)}
                  >
                    {tr("Показать ещё")}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}
