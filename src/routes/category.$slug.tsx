// localized-ui
import { tr, useUi } from "@/lib/ui";
import {
  createFileRoute,
  Link,
  notFound,
  stripSearchParams,
  type SearchSchemaInput,
} from "@tanstack/react-router";
import { Container } from "@/components/site/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { getCategory } from "@/data/categories";
import { useProducts } from "@/lib/catalog";
export const Route = createFileRoute("/category/$slug")({
  validateSearch: (search: { sub?: string } & SearchSchemaInput) => ({
    sub: typeof search.sub === "string" ? search.sub : "",
  }),
  search: { middlewares: [stripSearchParams({ sub: "" })] },
  loader: ({ params }) => {
    const category = getCategory(params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.category.title} · AGAS` },
      { name: "description", content: loaderData?.category.description },
      { property: "og:title", content: `${loaderData?.category.title} · AGAS` },
      { property: "og:image", content: loaderData?.category.cover },
    ],
  }),
  notFoundComponent: () => (
    <div className="py-32 text-center">
      <h1 className="font-serif text-4xl">{tr("Категория не найдена")}</h1>
      <Link to="/catalog" className="mt-6 inline-block text-sm underline">
        {tr("В каталог")}
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="py-32 text-center">
      <p className="text-sm">
        {tr(error instanceof Error ? error.message : "Не удалось выполнить действие")}
      </p>
    </div>
  ),
  component: CategoryPage,
});
function CategoryPage() {
  useUi();
  const { category } = Route.useLoaderData();
  const { sub } = Route.useSearch();
  const { products, loading, error, reload } = useProducts();
  const all = products.filter((product) => product.category === category.slug);
  const active = category.subcategories.find((value) => value.slug === sub)?.slug || "";
  const items = active ? all.filter((product) => product.subcategory === active) : all;
  return (
    <div>
      <section className="border-b border-border bg-surface py-8 md:py-12">
        <Container>
          <nav
            aria-label={tr("Путь к категории")}
            className="mb-6 flex gap-2 text-sm text-ink-soft"
          >
            <Link
              to="/catalog"
              search={{ q: "", all: false }}
              className="underline underline-offset-4"
            >
              {tr("Каталог")}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{tr(category.title)}</span>
          </nav>
          <h1 className="font-serif text-4xl text-foreground md:text-6xl">{tr(category.title)}</h1>
          <p className="mt-4 max-w-[52ch] text-base text-ink-soft">{tr(category.description)}</p>
        </Container>
      </section>

      <section className="py-8 md:py-12">
        <Container>
          <div className="mb-10 flex flex-wrap gap-2">
            {tr(
              [{ slug: "", title: "Все товары" }, ...category.subcategories].map((subcategory) => (
                <Link
                  key={subcategory.slug}
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  search={{ sub: subcategory.slug }}
                  aria-current={active === subcategory.slug ? "page" : undefined}
                  className={`rounded-full border border-border px-4 py-2 text-sm ${active === subcategory.slug ? "bg-foreground text-background" : "bg-surface text-ink-soft hover:text-foreground"}`}
                >
                  {tr(subcategory.title)}
                </Link>
              )),
            )}
          </div>
          {error && (
            <p className="mb-5 text-sm" role="alert">
              {tr(error)}{" "}
              <button onClick={reload} className="underline">
                {tr("Повторить")}
              </button>
            </p>
          )}
          <p className="mb-5 text-sm text-ink-soft" role="status">
            {loading && !items.length
              ? tr("Загрузка товаров…")
              : `${items.length} ${tr("товаров")}`}
          </p>
          {tr(
            !loading && items.length === 0 ? (
              <p className="py-24 text-center text-sm text-ink-soft">
                {tr("В этой категории пока нет товаров.")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
                {tr(items.map((p) => <ProductCard key={p.id} product={p} />))}
              </div>
            ),
          )}
        </Container>
      </section>
    </div>
  );
}
