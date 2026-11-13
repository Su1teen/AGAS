import { tr, useUi } from "@/lib/ui";
import { Link } from "@tanstack/react-router";
import { Heart, Plus, Check } from "lucide-react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { recordInterest } from "@/lib/platform";
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
  const addToCart = useCart((state) => state.add);
  const inCart = useCart((state) => state.items.some((item) => item.productId === product.id));
  const toggleFavorite = useFavorites((state) => state.toggle);
  const favorite = useFavorites((state) => state.ids.includes(product.id));
  const subscription = product.subscriptionPrice < product.price;
  return (
    <article className="group relative flex flex-col">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block rounded-2xl focus-visible:outline-2"
        aria-label={tr(product.name)}
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white ring-1 ring-border">
          <img
            src={product.images[0]}
            alt=""
            loading="lazy"
            width={550}
            height={550}
            className="h-full w-full object-contain p-3 transition-transform group-hover:scale-[1.04] md:p-6"
            onError={(event) => {
              const img = event.currentTarget;
              if (!img.src.endsWith("/product-placeholder.svg"))
                img.src = "/product-placeholder.svg";
            }}
          />
          {!product.demo && product.isNew && (
            <span className="absolute left-2 top-2 rounded-full bg-surface px-2 py-1 text-xs text-foreground">
              {tr("Новинка")}
            </span>
          )}
        </div>
        <div className={cn("mt-3 flex flex-col gap-1", size === "default" && "md:mt-4")}>
          <p className="text-xs text-ink-soft">{tr(product.brand)}</p>
          <h3 className="line-clamp-2 text-sm font-medium tracking-tight md:text-base">
            {tr(product.name)}
          </h3>
          {size === "default" && (
            <p className="line-clamp-1 text-xs text-ink-soft">{tr(product.subcategoryLabel)}</p>
          )}
          <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <strong className="text-sm tabular-nums md:text-base">
              {formatPrice(product.price)}
            </strong>
            {product.oldPrice && product.oldPrice > product.price && (
              <del className="text-xs text-ink-soft">{formatPrice(product.oldPrice)}</del>
            )}
          </div>
          {subscription && (
            <p className="text-xs text-ink-soft">
              {formatPrice(product.subscriptionPrice)} {tr("по подписке")}
            </p>
          )}
        </div>
      </Link>
      <button
        type="button"
        aria-label={tr(favorite ? "Убрать из избранного" : "В избранное")}
        aria-pressed={favorite}
        className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-full bg-background/95 shadow-sm hover:bg-surface"
        onClick={() => {
          toggleFavorite(product.id);
          if (!favorite && !product.demo) recordInterest(product.id, "favorite");
        }}
      >
        <Heart size={17} className={cn(favorite && "fill-foreground")} />
      </button>
      {!product.demo && (
        <div className="mt-auto pt-3">
          <button
            type="button"
            disabled={!product.inStock || inCart}
            className="flex min-h-9 items-center gap-1.5 rounded-full bg-foreground px-3 py-2 text-xs font-medium text-background disabled:bg-surface-strong disabled:text-ink-soft"
            onClick={() => {
              addToCart(product.id);
              recordInterest(product.id, "cart");
            }}
          >
            {inCart ? <Check size={14} /> : product.inStock ? <Plus size={14} /> : null}
            {tr(inCart ? "В корзине" : product.inStock ? "В корзину" : "Нет в наличии")}
          </button>
        </div>
      )}
    </article>
  );
}
