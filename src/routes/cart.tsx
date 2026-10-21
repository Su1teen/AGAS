import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Container } from "@/components/site/Container";
import { EmptyState } from "@/components/site/EmptyState";
import { useCart } from "@/store/cart";
import { products } from "@/data/products";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Корзина · AGAS" },
      { name: "description", content: "Ваш заказ в AGAS — спокойный путь к оформлению." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  const lines = items
    .map((i) => ({ item: i, product: products.find((p) => p.id === i.productId)! }))
    .filter((l) => l.product);

  const subtotal = lines.reduce((acc, l) => acc + l.product.price * l.item.quantity, 0);
  const delivery = subtotal === 0 ? 0 : subtotal >= 80000 ? 0 : 2500;
  const total = subtotal + delivery;

  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-10 border-b border-border pb-8">
          <span className="eyebrow">Шаг 1 из 3</span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">Корзина</h1>
        </div>

        {lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            title="Корзина пуста"
            description="Самое время посмотреть свежие коллекции и собрать сценарий для дома."
            actionLabel="В каталог"
            actionTo="/catalog"
          />
        ) : (
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-8">
              <ul className="divide-y divide-border border-y border-border">
                {lines.map(({ item, product }) => (
                  <li key={item.productId} className="flex gap-5 py-6">
                    <Link
                      to="/product/$slug"
                      params={{ slug: product.slug }}
                      className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-surface ring-1 ring-border"
                    >
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="eyebrow">{product.categoryLabel}</span>
                          <Link
                            to="/product/$slug"
                            params={{ slug: product.slug }}
                            className="mt-1 block text-base font-medium text-foreground hover:underline"
                          >
                            {product.name}
                          </Link>
                          <p className="mt-1 text-sm text-ink-soft">{product.tagline}</p>
                        </div>
                        <button
                          onClick={() => remove(item.productId)}
                          aria-label="Удалить"
                          className="text-ink-soft hover:text-foreground"
                        >
                          <Trash2 className="size-4" strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex h-9 items-center rounded-full border border-border bg-background">
                          <button
                            onClick={() => setQty(item.productId, item.quantity - 1)}
                            className="px-3 text-sm text-ink-soft hover:text-foreground"
                          >
                            −
                          </button>
                          <span className="w-6 text-center text-sm tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => setQty(item.productId, item.quantity + 1)}
                            className="px-3 text-sm text-ink-soft hover:text-foreground"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-base font-medium tabular-nums text-foreground">
                          {formatPrice(product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="lg:col-span-4">
              <div className="rounded-3xl border border-border bg-surface p-8 lg:sticky lg:top-24">
                <h3 className="eyebrow">Итог</h3>
                <dl className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Товары · {lines.length}</dt>
                    <dd className="font-medium tabular-nums">{formatPrice(subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Доставка</dt>
                    <dd className="font-medium tabular-nums">
                      {delivery === 0 ? "Бесплатно" : formatPrice(delivery)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-6 flex items-baseline justify-between border-t border-border pt-6">
                  <span className="text-sm text-ink-soft">К оплате</span>
                  <span className="font-serif text-3xl tabular-nums text-foreground">
                    {formatPrice(total)}
                  </span>
                </div>
                <Link
                  to="/checkout"
                  className="mt-6 flex h-12 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background"
                >
                  Оформить заказ <ArrowRight className="size-4" />
                </Link>
                <p className="mt-4 text-center text-xs text-ink-soft">
                  Безопасная оплата · Kaspi · Visa · MasterCard
                </p>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </div>
  );
}
