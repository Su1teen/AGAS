// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { X, Scale } from "lucide-react";
import { Container } from "@/components/site/Container";
import { EmptyState } from "@/components/site/EmptyState";
import { useCompare } from "@/store/compare";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/format";
export const Route = createFileRoute("/compare")({
  head: () => ({ meta: [{ title: "Сравнение · AGAS" }] }),
  component: ComparePage,
});
function ComparePage() {
  useUi();
  const ids = useCompare((s) => s.ids);
  const remove = useCompare((s) => s.remove);
  const items = products.filter((p) => ids.includes(p.id));
  const specKeys = Array.from(new Set(items.flatMap((p) => Object.keys(p.specs))));
  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-12 border-b border-border pb-8">
          <span className="eyebrow">{tr("Сравнение \u00B7 до 4 устройств")}</span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
            {tr("Сравнение характеристик")}
          </h1>
        </div>

        {tr(
          items.length === 0 ? (
            <EmptyState
              icon={<Scale className="size-6" />}
              title={tr("Добавьте устройства для сравнения")}
              description="Нажмите «Сравнить» на странице товара — здесь появится подробная таблица характеристик."
              actionLabel="В каталог"
              actionTo="/catalog"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="w-44 align-top"></th>
                    {tr(
                      items.map((p) => (
                        <th key={p.id} className="min-w-[240px] p-4 text-left align-top">
                          <div className="relative overflow-hidden rounded-2xl bg-surface ring-1 ring-border">
                            <img
                              src={p.images[0]}
                              alt={tr("")}
                              className="aspect-square w-full object-cover"
                            />
                            <button
                              onClick={() => remove(p.id)}
                              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/85 text-foreground backdrop-blur"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <Link
                            to="/product/$slug"
                            params={{ slug: p.slug }}
                            className="mt-3 block font-medium text-foreground hover:underline"
                          >
                            {tr(p.name)}
                          </Link>
                          <p className="mt-1 font-serif text-xl tabular-nums">
                            {tr(formatPrice(p.price))}
                          </p>
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {tr(
                    [
                      ["Рейтинг", (p: (typeof items)[number]) => `${p.rating} (${p.reviewsCount})`],
                      [
                        "Наличие",
                        (p: (typeof items)[number]) => (p.inStock ? "В наличии" : "Под заказ"),
                      ],
                      ["Категория", (p: (typeof items)[number]) => p.categoryLabel],
                    ].map(([label, fn]) => (
                      <tr key={label as string} className="border-t border-border">
                        <td className="py-4 pr-4 text-ink-soft">{tr(label as string)}</td>
                        {tr(
                          items.map((p) => (
                            <td key={p.id} className="px-4 py-4 font-medium text-foreground">
                              {tr((fn as (p: (typeof items)[number]) => string)(p))}
                            </td>
                          )),
                        )}
                      </tr>
                    )),
                  )}
                  {tr(
                    specKeys.map((k) => (
                      <tr key={k} className="border-t border-border">
                        <td className="py-4 pr-4 text-ink-soft">{tr(k)}</td>
                        {tr(
                          items.map((p) => (
                            <td key={p.id} className="px-4 py-4 text-foreground">
                              {tr(p.specs[k] ?? "—")}
                            </td>
                          )),
                        )}
                      </tr>
                    )),
                  )}
                </tbody>
              </table>
            </div>
          ),
        )}
      </Container>
    </div>
  );
}
