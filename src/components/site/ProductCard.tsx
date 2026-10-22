// localized-ui
import { tr, useUi } from "@/lib/ui";
import { Link } from "@tanstack/react-router";
import { Heart, Plus, Check } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { cn } from "@/lib/utils";
export function ProductCard({
  product,
  size = "default",
}: {
  product: Product;
  size?: "default" | "compact";
}) {
  useUi();
  const addToCart = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.some((i) => i.productId === product.id));
  const toggleFav = useFavorites((s) => s.toggle);
  const isFav = useFavorites((s) => s.ids.includes(product.id));
  return (
    <article className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block"
        aria-label={tr(product.name)}
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[linear-gradient(135deg,var(--surface),var(--background))] ring-1 ring-border">
          <img
            src={product.images[0]}
            alt={tr(product.name)}
            loading="lazy"
            className="h-full w-full object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          />

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {tr(
              product.isNew && (
                <span className="rounded-full bg-foreground/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-background shadow-sm backdrop-blur">
                  {tr("Новинка")}
                </span>
              ),
            )}
            {tr(
              product.oldPrice && (
                <span className="rounded-full bg-accent/90 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-accent-foreground shadow-sm backdrop-blur">
                  −{tr(Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100))}%
                </span>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              toggleFav(product.id);
            }}
            aria-label={tr(isFav ? "Убрать из избранного" : "В избранное")}
            className={cn(
              "absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100",
              isFav && "opacity-100",
            )}
          >
            <Heart className={cn("size-[16px]", isFav && "fill-foreground")} strokeWidth={1.5} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              if (!inCart) addToCart(product.id);
            }}
            disabled={!product.inStock || inCart}
            className={cn(
              "absolute bottom-3 right-3 flex h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-medium text-background opacity-0 transition-all duration-300 group-hover:opacity-100 disabled:cursor-not-allowed",
              !product.inStock && "bg-surface-strong text-ink-soft",
            )}
          >
            {tr(
              inCart ? (
                <>
                  <Check className="size-[14px]" strokeWidth={2} />
                  {tr("В корзине")}
                </>
              ) : product.inStock ? (
                <>
                  <Plus className="size-[14px]" strokeWidth={2} />
                  {tr("В корзину")}
                </>
              ) : (
                "Нет в наличии"
              ),
            )}
          </button>
        </div>

        <div className={cn("mt-4 flex flex-col gap-1.5", size === "compact" && "mt-3")}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-soft">
              {tr(product.brand)} · {tr(product.categoryLabel)}
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-ink-soft">
              {tr(product.inStock ? "В наличии" : "Под заказ")}
            </span>
          </div>
          <h3 className="text-[15px] font-medium tracking-tight text-foreground">
            {tr(product.name)}
          </h3>
          {tr(
            size === "default" && (
              <>
                <p className="text-[13px] text-ink-soft line-clamp-1">{tr(product.tagline)}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tr(
                    [product.subcategoryLabel, ...product.protocols.slice(0, 2)].map((label) => (
                      <span
                        key={label}
                        className="rounded-full border border-border bg-background/70 px-2 py-0.5 text-[10px] text-ink-soft"
                      >
                        {tr(label)}
                      </span>
                    )),
                  )}
                </div>
              </>
            ),
          )}
          <div className="mt-1 flex items-end justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-medium tracking-tight tabular-nums text-foreground">
                  {tr(formatPrice(product.subscriptionPrice))}
                </span>
                <span className="backdrop-blur-sm bg-foreground/5 border border-foreground/[0.08] rounded-full px-2 py-0.5 text-[10px] text-ink-soft tracking-wide">
                  {tr("по подписке")}
                </span>
              </div>
              <span className="text-[11px] text-ink-soft tabular-nums">
                {tr(formatPrice(product.price))}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[12px] tabular-nums text-ink-soft">
              <span className="size-1 rounded-full bg-foreground" />
              {tr(product.rating)}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
