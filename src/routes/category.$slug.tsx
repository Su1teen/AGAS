// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Container } from "@/components/site/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { getCategory } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
export const Route = createFileRoute("/category/$slug")({
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
      <p className="text-sm">{tr(error.message)}</p>
    </div>
  ),
  component: CategoryPage,
});
function CategoryPage() {
  useUi();
  const { category } = Route.useLoaderData();
  const items = getProductsByCategory(category.slug);
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="relative aspect-[16/8] max-h-[560px] w-full">
          <img
            src={category.cover}
            alt={tr(category.title)}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <Container className="relative flex h-full flex-col justify-end pb-12">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">
              {tr("Категория \u00B7")}
              {tr(items.length)}
              {tr("устройств")}
            </span>
            <h1 className="mt-3 font-serif text-5xl text-white md:text-7xl">
              {tr(category.title)}
            </h1>
            <p className="mt-4 max-w-[52ch] text-base text-white/85 text-pretty">
              {tr(category.description)}
            </p>
          </Container>
        </div>
      </section>

      <section className="py-16">
        <Container>
          <div className="mb-10 flex flex-wrap gap-2">
            {tr(
              category.subcategories.map((subcategory) => (
                <span
                  key={subcategory.slug}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft"
                >
                  {tr(subcategory.title)}
                </span>
              )),
            )}
          </div>
          {tr(
            items.length === 0 ? (
              <p className="py-24 text-center text-sm text-ink-soft">
                {tr("В этой категории пока нет товаров.")}
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                {tr(items.map((p) => <ProductCard key={p.id} product={p} />))}
              </div>
            ),
          )}
        </Container>
      </section>
    </div>
  );
}
