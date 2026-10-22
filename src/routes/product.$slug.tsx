// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  Heart,
  Check,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Wrench,
  RotateCcw,
  Star,
  Scale,
} from "lucide-react";
import { Container } from "@/components/site/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { getRelated } from "@/data/products";
import { loadProduct } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/store/cart";
import { useFavorites } from "@/store/favorites";
import { useCompare } from "@/store/compare";
import { cn } from "@/lib/utils";
export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await loadProduct(params.slug).catch(() => undefined);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name} · AGAS` },
      { name: "description", content: loaderData?.product.tagline },
      { property: "og:title", content: loaderData?.product.name },
      { property: "og:description", content: loaderData?.product.tagline },
      { property: "og:image", content: loaderData?.product.images[0] },
    ],
  }),
  notFoundComponent: () => (
    <div className="py-32 text-center">
      <h1 className="font-serif text-4xl">{tr("Товар не найден")}</h1>
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
  component: ProductPage,
});
function ProductPage() {
  useUi();
  const { product } = Route.useLoaderData();
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"specs" | "compat" | "delivery">("specs");
  const addToCart = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.some((i) => i.productId === product.id));
  const toggleFav = useFavorites((s) => s.toggle);
  const isFav = useFavorites((s) => s.ids.includes(product.id));
  const toggleCompare = useCompare((s) => s.toggle);
  const inCompare = useCompare((s) => s.ids.includes(product.id));
  const related = getRelated(product, 4);
  return (
    <div>
      <Container>
        <nav className="flex gap-2 pt-8 text-xs text-ink-soft">
          <Link to="/" className="hover:text-foreground">
            {tr("Главная")}
          </Link>
          <span>/</span>
          <Link to="/catalog" className="hover:text-foreground">
            {tr("Каталог")}
          </Link>
          <span>/</span>
          <Link
            to="/category/$slug"
            params={{ slug: product.category }}
            className="hover:text-foreground"
          >
            {tr(product.categoryLabel)}
          </Link>
          <span>/</span>
          <span className="text-foreground">{tr(product.name)}</span>
        </nav>
      </Container>

      <section className="py-12">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            {/* GALLERY */}
            <div className="lg:col-span-7">
              <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-border">
                <img
                  src={product.images[activeImg]}
                  alt={tr(product.name)}
                  className="aspect-square w-full object-contain p-8 mix-blend-multiply"
                />
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto scrollbar-hide">
                {tr(
                  product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        "h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface ring-1 ring-border transition-all",
                        activeImg === i && "ring-2 ring-foreground",
                      )}
                    >
                      <img src={img} alt={tr("")} className="h-full w-full object-cover" />
                    </button>
                  )),
                )}
              </div>
            </div>

            {/* INFO */}
            <div className="lg:col-span-5">
              <div className="lg:sticky lg:top-24">
                <div className="flex items-center gap-2">
                  <span className="eyebrow">{tr(product.collection)}</span>
                  {tr(
                    product.isNew && (
                      <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-background">
                        {tr("Новинка")}
                      </span>
                    ),
                  )}
                </div>
                <h1 className="mt-3 font-serif text-4xl leading-[1.05] text-foreground md:text-5xl">
                  {tr(product.name)}
                </h1>
                <p className="mt-4 text-lg text-ink-soft text-pretty">{tr(product.tagline)}</p>

                <div className="mt-6 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    {tr(
                      Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3.5",
                            i < Math.round(product.rating)
                              ? "fill-foreground text-foreground"
                              : "text-border",
                          )}
                        />
                      )),
                    )}
                    <span className="ml-1 text-foreground tabular-nums">{tr(product.rating)}</span>
                  </div>
                  <span className="text-ink-soft">
                    {tr(product.reviewsCount)}
                    {tr("отзывов")}
                  </span>
                  <span className="text-ink-soft">·</span>
                  <span className={product.inStock ? "text-foreground" : "text-ink-soft"}>
                    {tr(product.inStock ? "В наличии" : "Под заказ")}
                  </span>
                </div>

                <div className="mt-8">
                  <div className="flex items-baseline gap-3">
                    <span className="font-serif text-4xl text-foreground tabular-nums">
                      {tr(formatPrice(product.subscriptionPrice))}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-foreground/[0.08] bg-foreground/[0.04] px-3 py-1 text-[11px] font-medium tracking-wide text-ink-soft backdrop-blur-sm">
                      {tr("по подписке")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-ink-soft tabular-nums">
                    {tr("Розничная цена:")}
                    {tr(formatPrice(product.price))}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {tr("Или от")}
                    {tr(formatPrice(Math.round(product.subscriptionPrice / 12)))}
                    {tr("/ мес \u00B7 Kaspi Рассрочка 0-0-12")}
                  </p>
                </div>

                <div className="mt-8 flex items-stretch gap-3">
                  <div className="flex h-12 items-center rounded-full border border-border bg-background">
                    <button
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      className="px-4 text-lg text-ink-soft hover:text-foreground"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium tabular-nums">
                      {tr(qty)}
                    </span>
                    <button
                      onClick={() => setQty((q) => q + 1)}
                      className="px-4 text-lg text-ink-soft hover:text-foreground"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => addToCart(product.id, qty)}
                    disabled={!product.inStock}
                    className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-foreground text-sm font-medium text-background transition-transform hover:scale-[1.01] disabled:opacity-50"
                  >
                    {tr(inCart ? <Check className="size-4" /> : <ShoppingBag className="size-4" />)}
                    {tr(inCart ? "Добавлено в корзину" : "В корзину")}
                  </button>
                </div>

                <div className="mt-3 flex gap-3">
                  <button
                    onClick={() => toggleFav(product.id)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface"
                  >
                    <Heart className={cn("size-4", isFav && "fill-foreground")} />
                    {tr(isFav ? "В избранном" : "В избранное")}
                  </button>
                  <button
                    onClick={() => toggleCompare(product.id)}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border text-sm font-medium text-foreground hover:bg-surface"
                  >
                    <Scale className="size-4" />
                    {tr(inCompare ? "В сравнении" : "Сравнить")}
                  </button>
                </div>

                {/* TRUST mini */}
                <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border">
                  {tr(
                    [
                      { icon: Truck, t: "Доставка завтра", s: "По Астане" },
                      { icon: Wrench, t: "Бесплатный монтаж", s: "При заказе от 200 000 ₸" },
                      { icon: ShieldCheck, t: "Гарантия 3 года", s: "Сервис AGAS" },
                      { icon: RotateCcw, t: "Возврат 30 дней", s: "Без вопросов" },
                    ].map(({ icon: Icon, t, s }) => (
                      <div key={t} className="bg-background p-4">
                        <Icon className="size-5 text-foreground" strokeWidth={1.4} />
                        <p className="mt-3 text-xs font-medium text-foreground">{tr(t)}</p>
                        <p className="text-[11px] text-ink-soft">{tr(s)}</p>
                      </div>
                    )),
                  )}
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {tr(
                    product.highlights.map((h) => (
                      <span
                        key={h}
                        className="rounded-full bg-surface px-3 py-1.5 text-[11px] font-medium text-ink-soft"
                      >
                        {tr(h)}
                      </span>
                    )),
                  )}
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* DESCRIPTION */}
      <section className="py-20">
        <Container>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-5">
              <span className="eyebrow">{tr("О продукте")}</span>
              <h2 className="mt-4 font-serif text-4xl text-foreground text-balance">
                {tr(product.tagline)}
              </h2>
              <p className="mt-6 text-base text-ink-soft text-pretty">{tr(product.description)}</p>
            </div>
            <div className="lg:col-span-7">
              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-border md:grid-cols-2">
                {tr(
                  product.features.map((f) => (
                    <div key={f.title} className="bg-background p-8">
                      <h4 className="font-serif text-xl text-foreground">{tr(f.title)}</h4>
                      <p className="mt-2 text-sm text-ink-soft text-pretty">{tr(f.text)}</p>
                    </div>
                  )),
                )}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* TABS: SPECS / COMPATIBILITY / DELIVERY */}
      <section className="border-t border-border bg-surface/40 py-20">
        <Container>
          <div className="mb-10 flex gap-2 border-b border-border">
            {tr(
              (
                [
                  ["specs", "Характеристики"],
                  ["compat", "Совместимость"],
                  ["delivery", "Доставка и установка"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  data-active={tab === key}
                  className="-mb-px border-b-2 border-transparent px-4 pb-4 text-sm text-ink-soft transition-colors hover:text-foreground data-[active=true]:border-foreground data-[active=true]:text-foreground data-[active=true]:font-medium"
                >
                  {tr(label)}
                </button>
              )),
            )}
          </div>

          {tr(
            tab === "specs" && (
              <dl className="grid grid-cols-1 divide-y divide-border border-y border-border md:grid-cols-2 md:divide-y-0 md:gap-x-16">
                {tr(
                  Object.entries(product.specs).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-baseline justify-between gap-6 border-b border-border py-4"
                    >
                      <dt className="text-sm text-ink-soft">{tr(k)}</dt>
                      <dd className="text-sm font-medium text-foreground">{tr(v)}</dd>
                    </div>
                  )),
                )}
              </dl>
            ),
          )}

          {tr(
            tab === "compat" && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {tr(
                  product.compatibility.map((c) => (
                    <div
                      key={c}
                      className="rounded-2xl border border-border bg-background p-5 text-center"
                    >
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-foreground">
                        <Check className="size-4" />
                      </div>
                      <p className="text-sm font-medium text-foreground">{tr(c)}</p>
                      <p className="mt-1 text-[11px] text-ink-soft">{tr("Полная поддержка")}</p>
                    </div>
                  )),
                )}
              </div>
            ),
          )}

          {tr(
            tab === "delivery" && (
              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-border md:grid-cols-3">
                {tr(
                  [
                    {
                      t: "Доставка по Астане",
                      d: "Сегодня или завтра, в удобный двухчасовой интервал.",
                    },
                    {
                      t: "По Казахстану",
                      d: "Курьер 2–4 дня. Бесплатно при заказе от 80 000 ₸.",
                    },
                    {
                      t: "Установка под ключ",
                      d: "Инженер настроит сценарии и обучит работе с системой.",
                    },
                  ].map((b) => (
                    <div key={b.t} className="bg-background p-8">
                      <h4 className="font-medium text-foreground">{tr(b.t)}</h4>
                      <p className="mt-2 text-sm text-ink-soft text-pretty">{tr(b.d)}</p>
                    </div>
                  )),
                )}
              </div>
            ),
          )}
        </Container>
      </section>

      {/* REVIEWS */}
      <section className="py-20">
        <Container>
          <SectionHeading
            eyebrow={`Отзывы · ${product.reviewsCount}`}
            title={tr(
              <>
                {tr("Рейтинг")}
                {tr(product.rating)}
                {tr("из 5 \u00B7")}
                {tr(" ")}
                <em className="font-serif italic text-ink-soft">{tr("проверенные покупатели")}</em>
              </>,
            )}
          />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {tr(
              [
                {
                  name: "Алия К.",
                  city: "Астана",
                  date: "12 апреля",
                  title: "Тихо и красиво",
                  text: "Долго выбирала между несколькими брендами — остановилась на AGAS. Подача, упаковка, ощущение в руке — всё на уровне.",
                },
                {
                  name: "Данияр М.",
                  city: "Астана",
                  date: "3 апреля",
                  title: "Сценарии работают мгновенно",
                  text: "Особенно радует, что всё работает локально, без задержки. Инженер приехал и за час настроил весь дом.",
                },
                {
                  name: "Сауле Т.",
                  city: "Шымкент",
                  date: "28 марта",
                  title: "Отдельное спасибо за поддержку",
                  text: "Возникли вопросы по интеграции с Apple Home — ответили в течение 5 минут. Сервис вне всяких похвал.",
                },
              ].map((r) => (
                <article
                  key={r.name}
                  className="rounded-3xl border border-border bg-background p-7"
                >
                  <div className="flex items-center gap-1">
                    {tr(
                      Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="size-3.5 fill-foreground text-foreground" />
                      )),
                    )}
                  </div>
                  <h4 className="mt-4 font-medium text-foreground">{tr(r.title)}</h4>
                  <p className="mt-2 text-sm text-ink-soft text-pretty">{tr(r.text)}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-ink-soft">
                    <span>
                      {tr(r.name)} · {tr(r.city)}
                    </span>
                    <span>{tr(r.date)}</span>
                  </div>
                </article>
              )),
            )}
          </div>
        </Container>
      </section>

      {/* RELATED */}
      <section className="py-20">
        <Container>
          <SectionHeading
            eyebrow="Похожие объекты"
            title={tr("С этим устройством хорошо работает")}
            actionLabel="Весь каталог"
            actionTo="/catalog"
          />
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {tr(related.map((p) => <ProductCard key={p.id} product={p} />))}
          </div>
        </Container>
      </section>
    </div>
  );
}
