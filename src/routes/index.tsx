// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/site/Container";
import { ProductCard } from "@/components/site/ProductCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { TrustSignals } from "@/components/site/TrustSignals";
import { ScenariosCarousel } from "@/components/site/ScenariosCarousel";
import { products } from "@/data/products";
import { catalogGroups, categories } from "@/data/categories";
import { formatPrice } from "@/lib/format";
import heroHub from "@/assets/hero-hub.jpg";
import detail from "@/assets/detail-material.jpg";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AGAS — Маркетплейс умного дома · Астана" },
      {
        name: "description",
        content:
          "Освещение, акустика, климат и безопасность. Премиальные устройства умного дома с доставкой по Казахстану.",
      },
      { property: "og:title", content: "AGAS — Маркетплейс умного дома" },
    ],
  }),
  component: HomePage,
});
function HomePage() {
  useUi();
  const featured = products.find((p) => p.featured && p.isNew) ?? products[0];
  const recommended = products.filter((p) => p.featured || p.oldPrice || p.isNew).slice(0, 8);
  const bundle = products
    .filter((p) =>
      [
        "philips-hue-white-color-ambiance-a19",
        "aqara-smart-wall-switch-h1-eu-no-neutral",
        "aqara-presence-sensor-fp2",
        "aqara-hub-m3",
      ].includes(p.slug),
    )
    .slice(0, 4);
  const promoBanners = [
    {
      label: "Клубная цена",
      title: "Световой пакет −14%",
      text: "Лампы, лента и выключатель для первой комнаты.",
      badge: "Доступно с Pro и Ultra",
      to: "/category/lighting",
      image: products.find((p) => p.slug === "aqara-led-strip-t1")?.images[0],
    },
    {
      label: "B2B ядро",
      title: "Хабы и сеть для объекта",
      text: "Matter, Thread, PoE и Wi‑Fi 7 в одной инженерной подборке.",
      badge: "Инженерный аудит Ultra",
      to: "/category/hubs-networking",
      image: products.find((p) => p.slug === "aqara-hub-m3")?.images[0],
    },
    {
      label: "Вместе покупают",
      title: "Безопасность без шума",
      text: "Замок, камера, видеозвонок и датчики в едином сценарии.",
      badge: "Спеццена для Starter",
      to: "/category/security",
      image: products.find((p) => p.slug === "aqara-smart-door-lock-a100-zigbee")?.images[0],
    },
  ];
  return (
    <div>
      {/* HERO */}
      <section className="relative pt-8 pb-16 md:pt-10 md:pb-20">
        <Container>
          <div className="grid grid-cols-12 gap-8 items-end">
            <div className="col-span-12 lg:col-span-5">
              <span className="eyebrow">{tr("Коллекция 01 \u00B7 2026")}</span>
              <h1 className="mt-6 font-serif text-5xl leading-[1.02] text-foreground md:text-7xl lg:text-[5.5rem] text-balance">
                {tr("Архитектура вашего комфорта")}
              </h1>
              <p className="mt-8 max-w-[42ch] text-base text-ink-soft text-pretty md:text-lg">
                {tr(
                  "Тихая, точная и продуманная экосистема устройств умного дома. Матовый алюминий, локальная автоматизация и спокойный сценарий жизни.",
                )}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <Link
                  to="/catalog"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform hover:scale-[1.02]"
                >
                  {tr("Перейти в каталог")}
                  <ArrowRight className="size-4" strokeWidth={1.8} />
                </Link>
                <Link
                  to="/product/$slug"
                  params={{ slug: featured.slug }}
                  className="inline-flex h-12 items-center rounded-full border border-border bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  {tr("Узнать о")}
                  {tr(featured.collection)}
                </Link>
              </div>

              <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
                <div>
                  <dt className="eyebrow">{tr("Устройств")}</dt>
                  <dd className="mt-2 font-serif text-2xl text-foreground">256+</dd>
                </div>
                <div>
                  <dt className="eyebrow">{tr("Отклик")}</dt>
                  <dd className="mt-2 font-serif text-2xl text-foreground">{tr("15мс")}</dd>
                </div>
                <div>
                  <dt className="eyebrow">{tr("Гарантия")}</dt>
                  <dd className="mt-2 font-serif text-2xl text-foreground">{tr("3 года")}</dd>
                </div>
              </dl>
            </div>

            <div className="col-span-12 lg:col-span-7">
              <div className="relative overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
                <img
                  src={heroHub}
                  alt={tr("AGAS Omni Hub S2")}
                  width={1600}
                  height={1600}
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4">
                  <div className="rounded-2xl bg-background/85 px-4 py-3 backdrop-blur-md">
                    <span className="eyebrow">{tr(featured.collection)}</span>
                    <p className="mt-1 text-sm font-medium text-foreground">{tr(featured.name)}</p>
                  </div>
                  <div className="rounded-2xl bg-background/85 px-4 py-3 text-right backdrop-blur-md">
                    <span className="eyebrow">{tr("от")}</span>
                    <p className="mt-1 text-sm font-medium tracking-tight text-foreground tabular-nums">
                      {tr(formatPrice(featured.price))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      {/* SCENARIOS CAROUSEL */}
      <ScenariosCarousel />
      {/* COMMERCIAL BANNERS */}
      <section className="-mt-12 pb-20">
        <Container>
          <div className="grid gap-4 lg:grid-cols-3">
            {tr(
              promoBanners.map((banner, index) => (
                <Link
                  key={banner.title}
                  to={banner.to}
                  className="group relative min-h-[220px] overflow-hidden rounded-3xl border border-border bg-surface p-7 transition-transform duration-500 hover:-translate-y-1"
                >
                  <div className="relative z-10 max-w-[16rem]">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="eyebrow">
                        {tr(String(index + 1).padStart(2, "0"))} · {tr(banner.label)}
                      </span>
                      <span className="inline-flex rounded-full border border-white/20 bg-foreground/5 px-2.5 py-0.5 text-[10px] font-medium text-ink-soft shadow-inner backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                        {tr(banner.badge)}
                      </span>
                    </div>
                    <h3 className="font-serif text-3xl leading-tight text-foreground">
                      {tr(banner.title)}
                    </h3>
                    <p className="mt-3 text-sm text-ink-soft text-pretty">{tr(banner.text)}</p>
                  </div>
                  {tr(
                    banner.image && (
                      <img
                        src={banner.image}
                        alt={tr("")}
                        loading="lazy"
                        className="absolute -bottom-5 -right-5 h-44 w-44 object-contain opacity-80 transition-transform duration-700 group-hover:scale-105"
                      />
                    ),
                  )}
                </Link>
              )),
            )}
          </div>
          <div className="mt-10 flex justify-center">
            <Link
              to="/subscriptions"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border bg-surface px-8 text-sm font-medium text-foreground transition-all duration-300 hover:scale-[1.02] hover:bg-background hover:shadow-sm"
            >
              {tr("Узнать больше о подписках и ценах")}
              <ArrowRight className="size-4" strokeWidth={1.8} />
            </Link>
          </div>
        </Container>
      </section>

      {/* CATEGORIES */}
      <section className="bg-surface/50 py-24">
        <Container>
          <SectionHeading
            eyebrow="Категории"
            title={tr(
              <>
                {tr("Две группы, тринадцать")}
                <em className="font-serif italic">{tr("направлений")}</em>
              </>,
            )}
            actionLabel="Все категории"
            actionTo="/catalog"
          />
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {tr(
              catalogGroups.map((group) => (
                <div
                  key={group.slug}
                  className="rounded-3xl border border-border bg-background p-6"
                >
                  <span className="eyebrow">{tr(group.shortTitle)}</span>
                  <h3 className="mt-3 font-serif text-3xl text-foreground">{tr(group.title)}</h3>
                  <p className="mt-3 max-w-[48ch] text-sm text-ink-soft">{tr(group.description)}</p>
                </div>
              )),
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {tr(
              categories.map((cat, idx) => (
                <Link
                  key={cat.slug}
                  to="/category/$slug"
                  params={{ slug: cat.slug }}
                  className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface ring-1 ring-border"
                >
                  <img
                    src={cat.cover}
                    alt={tr(cat.title)}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-5">
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/75 tabular-nums">
                      0{tr(idx + 1)}
                    </span>
                    <h3 className="mt-1 font-serif text-2xl text-white">{tr(cat.title)}</h3>
                    <p className="mt-1 text-xs text-white/75">{tr(cat.tagline)}</p>
                  </div>
                </Link>
              )),
            )}
          </div>
        </Container>
      </section>

      {/* FEATURED EDITORIAL
        <section className="py-32">
          <Container>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <div className="overflow-hidden rounded-3xl bg-surface ring-1 ring-border">
                  <img
                    src={detail}
                    alt="Анодированный алюминий — макро"
                    loading="lazy"
                    className="aspect-[4/5] w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <span className="eyebrow">Совершенство в цифрах</span>
                <h2 className="mt-4 font-serif text-4xl leading-[1.05] text-foreground md:text-5xl text-balance">
                  Каждая деталь рассчитана и проверена 240 часов.
                </h2>
                <p className="mt-6 max-w-[44ch] text-base text-ink-soft text-pretty">
                  От толщины стенок корпуса до угла фаски на основании — мы одержимы деталями, которые
                  делают продукт долговечным.
                </p>

                <dl className="mt-10 divide-y divide-border border-y border-border">
                  {[
                    ["Материал корпуса", "Анодированный алюминий 6063-T6"],
                    ["Протокол связи", "Thread · Matter 1.2 · Wi-Fi 6"],
                    ["Время отклика", "< 15 мс"],
                    ["Уровень шума", "< 12 дБ"],
                    ["Автономность", "До 24 месяцев"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-6 py-5">
                      <dt className="text-sm text-ink-soft">{k}</dt>
                      <dd className="text-sm font-medium text-foreground">{v}</dd>
                    </div>
                  ))}
                </dl>

                <Link
                  to="/product/$slug"
                  params={{ slug: featured.slug }}
                  className="mt-10 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-foreground px-6 text-sm font-medium text-background"
                >
                  Спецификации {featured.collection}
                  <ArrowRight className="size-4" strokeWidth={1.8} />
                </Link>
              </div>
            </div>
          </Container>
        </section>
  */}
      {/* RECOMMENDED GRID */}
      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Рекомендации"
            title={tr(
              <>
                {tr("Объекты, на которые")}
                <em className="font-serif italic">{tr("смотрят")}</em>
              </>,
            )}
            description="Подборка устройств, которые чаще всего выбирают в первый раз."
            actionLabel="Весь каталог"
            actionTo="/catalog"
          />
          <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {tr(recommended.map((p) => <ProductCard key={p.id} product={p} />))}
          </div>
          <div className="mt-14 rounded-3xl border border-border bg-surface/60 p-6 md:p-8">
            <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <span className="eyebrow">{tr("Вместе с этим покупают")}</span>
                <h3 className="mt-3 font-serif text-3xl text-foreground">
                  {tr("Пакет \u00ABСвет + присутствие\u00BB")}
                </h3>
              </div>
              <p className="max-w-[42ch] text-sm text-ink-soft">
                {tr(
                  "История заказов показывает: лампы чаще всего дополняют настенным выключателем, mmWave-датчиком и хабом Matter.",
                )}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {tr(bundle.map((p) => <ProductCard key={p.id} product={p} size="compact" />))}
            </div>
          </div>
        </Container>
      </section>

      {/* TRUST */}
      <section className="py-24">
        <Container>
          <SectionHeading
            eyebrow="Сервис"
            title={tr("Спокойствие включено в стоимость")}
            description="Доставка, монтаж, гарантия и поддержка от инженеров AGAS."
          />
          <TrustSignals />
        </Container>
      </section>
    </div>
  );
}
