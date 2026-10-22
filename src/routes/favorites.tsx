// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Container } from "@/components/site/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { EmptyState } from "@/components/site/EmptyState";
import { useFavorites } from "@/store/favorites";
import { products } from "@/data/products";
export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Избранное · AGAS" }] }),
  component: FavoritesPage,
});
function FavoritesPage() {
  useUi();
  const ids = useFavorites((s) => s.ids);
  const items = products.filter((p) => ids.includes(p.id));
  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-12 border-b border-border pb-8">
          <span className="eyebrow">
            {tr("Избранное \u00B7")}
            {tr(items.length)}
          </span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
            {tr("Объекты, которые вы отметили")}
          </h1>
        </div>
        {tr(
          items.length === 0 ? (
            <EmptyState
              icon={<Heart className="size-6" />}
              title={tr("Пока пусто")}
              description="Отмечайте сердцем устройства, которые вам нравятся — они появятся здесь."
              actionLabel="В каталог"
              actionTo="/catalog"
            />
          ) : (
            <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {tr(items.map((p) => <ProductCard key={p.id} product={p} />))}
            </div>
          ),
        )}
      </Container>
    </div>
  );
}
