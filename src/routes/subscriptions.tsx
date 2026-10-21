import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Star } from "lucide-react";
import { Container } from "@/components/site/Container";
import { SectionHeading } from "@/components/site/SectionHeading";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subscriptions")({
  component: SubscriptionsPage,
  head: () => ({
    meta: [
      { title: "Подписки · AGAS" },
      { name: "description", content: "Выберите ваш уровень контроля." },
    ],
  }),
});

function SubscriptionsPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      id: "silver",
      name: "Silver",
      gradientClass: "bg-clip-text text-transparent bg-gradient-to-r from-gray-300 via-gray-100 to-gray-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]",
      tagline: "Базовый комфорт для квартир",
      monthly: "4 900",
      yearly: "3 900",
      features: [
        "Клубная скидка 10% на контроллеры и компоненты",
        "Поддержка до 2 центральных хабов в экосистеме",
        "Базовые сценарии автоматизации освещения",
        "Онлайн-техподдержка 24/7",
      ],
      cta: "Активировать Silver",
      popular: false,
    },
    {
      id: "gold",
      name: "Gold",
      gradientClass: "bg-clip-text text-transparent bg-gradient-to-r from-yellow-500 via-yellow-200 to-yellow-600 drop-shadow-[0_0_12px_rgba(234,179,8,0.35)]",
      tagline: "Профессиональная экосистема",
      monthly: "12 900",
      yearly: "9 900",
      features: [
        "Закрытая скидка 15% на всё оборудование DALI и RF Mesh",
        "Поддержка до 10 хабов на одном или нескольких объектах",
        "Удаленная помощь инженера в отладке сложных сценариев",
        "Ускоренная b2b-доставка по всему Казахстану",
        "Прямая интеграция с Яндекс Алисой и Apple HomeKit",
      ],
      cta: "Перейти на Gold",
      popular: true,
    },
    {
      id: "platinum",
      name: "Platinum",
      gradientClass: "bg-clip-text text-transparent bg-gradient-to-r from-slate-400 via-slate-200 to-slate-600 drop-shadow-[0_0_14px_rgba(148,163,184,0.4)]",
      tagline: "Инженерный максимум для бизнеса",
      monthly: "29 900",
      yearly: "23 900",
      features: [
        "Максимальная личная скидка 20% на весь каталог",
        "Полный безлимит на количество подключенных устройств",
        "Выделенный инженер-проектировщик + ежегодный выезд на аудит",
        "Замена брака день-в-день из резервного фонда компании",
        "Ранний доступ к тестированию новых линеек Sunricher",
      ],
      cta: "Подключить Platinum",
      popular: false,
    },
  ];

  return (
    <div className="pb-24 pt-16 md:pb-32 md:pt-24">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading
            eyebrow="Уровни подписки"
            title="Выберите ваш уровень контроля"
            description="Подписка окупается при первой закупке оборудования. Доступ к закрытым ценам, инженерному сервису и расширенной гарантии."
            centered
          />
        </div>

        {/* BILLING TOGGLE */}
        <div className="mt-12 flex justify-center">
          <div className="relative inline-flex items-center rounded-full border border-border bg-surface p-1 ring-1 ring-white/5 backdrop-blur-md">
            <div
              className={cn(
                "absolute bottom-1 top-1 w-1/2 rounded-full bg-background shadow transition-transform duration-300 ease-out",
                billing === "monthly" ? "translate-x-0" : "translate-x-full",
              )}
            />
            <button
              onClick={() => setBilling("monthly")}
              className={cn(
                "relative z-10 w-44 rounded-full py-2.5 text-sm font-medium transition-colors",
                billing === "monthly" ? "text-foreground" : "text-ink-soft hover:text-foreground",
              )}
            >
              Месячная оплата
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={cn(
                "relative z-10 flex w-44 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-medium transition-colors",
                billing === "yearly" ? "text-foreground" : "text-ink-soft hover:text-foreground",
              )}
            >
              Годовая оплата
              <span className="inline-flex rounded-full bg-foreground px-2 py-0.5 text-[10px] uppercase tracking-wide text-background">
                −20%
              </span>
            </button>
          </div>
        </div>

        {/* PRICING GRID */}
        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-3xl p-8 transition-all duration-300",
                plan.popular
                  ? "border border-foreground/15 bg-background shadow-[inset_0_0_20px_rgba(0,0,0,0.02)] ring-1 ring-white/10 dark:border-white/20 dark:bg-surface/80 dark:shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-xl"
                  : "border border-border bg-surface/50",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                  <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-surface px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-md">
                    <Star className="size-3.5 fill-foreground text-foreground" />
                    Популярный выбор
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={cn("font-serif text-3xl font-bold tracking-wide", plan.gradientClass)}>{plan.name}</h3>
                <p className="mt-2 text-sm text-ink-soft">{plan.tagline}</p>
              </div>

              <div className="mb-8 flex items-baseline gap-2">
                <span className="font-serif text-4xl text-foreground tabular-nums">
                  {billing === "monthly" ? plan.monthly : plan.yearly} ₸
                </span>
                <span className="text-sm text-ink-soft">/ мес</span>
              </div>

              <div className="mb-8 flex-1">
                <ul className="flex flex-col gap-4">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex gap-3 text-sm text-foreground">
                      <Check className="mt-0.5 size-4 shrink-0 text-ink-soft" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                className={cn(
                  "w-full rounded-full py-3.5 text-sm font-medium transition-all duration-300 hover:scale-[1.02]",
                  plan.popular
                    ? "bg-foreground text-background shadow-md hover:bg-foreground/90"
                    : "border border-border bg-background text-foreground hover:bg-surface",
                )}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
