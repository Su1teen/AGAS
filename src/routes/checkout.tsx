import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { FUNDING, PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Container } from "@/components/site/Container";
import { useCart } from "@/store/cart";
import { products } from "@/data/products";
import type { Product } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { createPaypalOrder, capturePaypalOrder } from "@/lib/paypal";

// --- TYPES & HELPERS ---
export type SubscriptionTier = "none" | "silver" | "gold" | "platinum";

export function calculateTotals(
  lines: { product: Product; item: { quantity: number; productId: string } }[],
  tier: SubscriptionTier,
  deliveryType: "courier" | "pickup",
) {
  const subtotal = lines.reduce((acc, l) => acc + l.product.price * l.item.quantity, 0);

  // Guest calculations (Baseline)
  const guestVat = subtotal * 0.16; // 16% VAT
  const guestDelivery = deliveryType === "courier" ? subtotal * 0.1 : 0; // +10% shipping
  const guestTotal = subtotal + guestVat + guestDelivery;

  // Subscriber logic
  let discountPercent = 0;
  let hasFreeDelivery = false;

  if (tier === "silver") {
    discountPercent = 0.1; // 10% discount
  } else if (tier === "gold") {
    discountPercent = 0.15; // 15% discount
    hasFreeDelivery = true;
  } else if (tier === "platinum") {
    discountPercent = 0.2; // 20% discount
    hasFreeDelivery = true;
  }

  const subscriberDiscount = subtotal * discountPercent;
  const finalSubtotal = subtotal - subscriberDiscount;
  const finalVat = finalSubtotal * 0.16;
  const finalDelivery = hasFreeDelivery || deliveryType === "pickup" ? 0 : finalSubtotal * 0.1;
  const finalTotal = finalSubtotal + finalVat + finalDelivery;

  const savings = guestTotal - finalTotal;

  return {
    baseSubtotal: subtotal,
    vat: tier === "none" ? guestVat : finalVat,
    delivery: tier === "none" ? guestDelivery : finalDelivery,
    discount: subscriberDiscount,
    total: tier === "none" ? guestTotal : finalTotal,
    guestTotal,
    savings,
  };
}

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: "Оформление заказа · AGAS" }],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const navigate = Route.useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [delivery, setDelivery] = useState<"courier" | "pickup">("courier");
  const [payment, setPayment] = useState<"kaspi" | "card" | "paypal" | "cash">("kaspi");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  // Using a local state to let user test the 'Smart Savings' logic during checkout.
  // In a real app, this would be fetched from user/auth store.
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>("gold");

  const lines = items
    .map((i) => ({ item: i, product: products.find((p) => p.id === i.productId)! }))
    .filter((l) => l.product);

  const totals = calculateTotals(lines, subscriptionTier, delivery);
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID ?? "sb";
  const paypalCurrency = (import.meta.env.VITE_PAYPAL_CURRENCY ?? "USD").toUpperCase();
  const paypalCheckoutData = {
    items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
    subscriptionTier,
    deliveryType: delivery,
  };

  const steps = [
    { n: 1, label: "Доставка" },
    { n: 2, label: "Оплата" },
    { n: 3, label: "Подтверждение" },
  ];

  if (lines.length === 0) {
    return (
      <div className="py-32 text-center">
        <h1 className="font-serif text-4xl">Корзина пуста</h1>
        <Link to="/catalog" className="mt-6 inline-block text-sm underline">
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-10">
          <span className="eyebrow">Оформление</span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl">
            Тихий, прозрачный заказ
          </h1>
        </div>

        {/* STEPPER */}
        <div className="mb-12 flex items-center gap-3">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium",
                  step >= s.n ? "bg-foreground text-background" : "bg-surface text-ink-soft",
                )}
              >
                {step > s.n ? <Check className="size-4" /> : s.n}
              </div>
              <span
                className={cn(
                  "text-sm",
                  step >= s.n ? "text-foreground font-medium" : "text-ink-soft",
                )}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && <span className="mx-2 h-px w-10 bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            {step === 1 && (
              <div className="space-y-8">
                <div className="rounded-3xl border border-border p-8">
                  <h3 className="eyebrow">Получатель</h3>
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {[
                      ["Имя", "Айгерим"],
                      ["Фамилия", "Касенова"],
                      ["Телефон", "+7 (___) ___ __ __"],
                      ["Email", "you@agas.kz"],
                    ].map(([l, p]) => (
                      <label key={l} className="flex flex-col gap-2">
                        <span className="text-xs text-ink-soft">{l}</span>
                        <input
                          placeholder={p}
                          className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-foreground"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-border p-8">
                  <h3 className="eyebrow">Способ доставки</h3>
                  <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                    {(
                      [
                        ["courier", "Курьер по Казахстану", "2 500 ₸ · от 80 000 ₸ бесплатно"],
                        ["pickup", "Самовывоз из шоурума", "Бесплатно · Астана, ул. Достык, 16"],
                      ] as const
                    ).map(([key, t, s]) => (
                      <button
                        key={key}
                        onClick={() => setDelivery(key)}
                        className={cn(
                          "flex flex-col items-start rounded-2xl border p-5 text-left transition-colors",
                          delivery === key
                            ? "border-foreground bg-surface"
                            : "border-border hover:bg-surface",
                        )}
                      >
                        <span className="text-sm font-medium text-foreground">{t}</span>
                        <span className="mt-1 text-xs text-ink-soft">{s}</span>
                      </button>
                    ))}
                  </div>
                  {delivery === "courier" && (
                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <input
                        placeholder="Город"
                        className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-foreground md:col-span-1"
                        defaultValue="Астана"
                      />
                      <input
                        placeholder="Адрес и квартира"
                        className="h-12 rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-foreground md:col-span-1"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="h-12 w-full rounded-full bg-foreground text-sm font-medium text-background md:w-auto md:px-8"
                >
                  Перейти к оплате
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="rounded-3xl border border-border p-8">
                  <h3 className="eyebrow">Способ оплаты</h3>
                  <div className="mt-6 space-y-3">
                    {(
                      [
                        ["kaspi", "Kaspi", "Через Kaspi.kz · Рассрочка 0-0-12 доступна"],
                        ["card", "Банковская карта", "Visa · MasterCard · UnionPay"],
                        ["paypal", "PayPal", "Оплата картой или со счета PayPal"],
                        ["cash", "При получении", "Наличными или картой курьеру"],
                      ] as const
                    ).map(([key, t, s]) => (
                      <button
                        key={key}
                        onClick={() => setPayment(key)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-2xl border p-5 text-left transition-colors",
                          payment === key
                            ? "border-foreground bg-surface"
                            : "border-border hover:bg-surface",
                        )}
                      >
                        <div>
                          <span className="text-sm font-medium text-foreground">{t}</span>
                          <p className="mt-1 text-xs text-ink-soft">{s}</p>
                        </div>
                        <div
                          className={cn(
                            "h-5 w-5 rounded-full border-2",
                            payment === key ? "border-foreground bg-foreground" : "border-border",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="h-12 rounded-full border border-border px-6 text-sm font-medium text-foreground"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    className="h-12 flex-1 rounded-full bg-foreground text-sm font-medium text-background md:flex-none md:px-8"
                  >
                    Подтвердить
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div className="rounded-3xl border border-border p-8">
                  <h3 className="eyebrow">Проверьте детали</h3>
                  <dl className="mt-6 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Доставка</dt>
                      <dd>{delivery === "courier" ? "Курьер" : "Самовывоз"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Оплата</dt>
                      <dd className="capitalize">
                        {payment === "kaspi"
                          ? "Kaspi"
                          : payment === "card"
                            ? "Карта"
                            : payment === "paypal"
                              ? "PayPal"
                              : "При получении"}
                      </dd>
                    </div>
                  </dl>
                </div>

                {payment === "paypal" || payment === "card" ? (
                  <div className="mt-6 relative rounded-3xl border border-white/10 bg-surface p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md">
                    <div className="mb-5 rounded-2xl border border-border bg-background/70 p-4 text-sm text-ink-soft">
                      {payment === "card"
                        ? "PayPal безопасно откроет защищенную форму оплаты банковской картой. Данные карты не хранятся на AGAS."
                        : "PayPal безопасно откроет оплату через PayPal или банковскую карту. Данные карты не хранятся на AGAS."}
                    </div>
                    {paymentError && (
                      <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-600">
                        {paymentError}
                      </div>
                    )}
                    <PayPalScriptProvider
                      options={{
                        clientId: paypalClientId,
                        currency: paypalCurrency,
                        intent: "capture",
                        components: "buttons",
                        enableFunding: "card",
                      }}
                    >
                      {payment === "paypal" && (
                        <PayPalButtons
                          style={{
                            layout: "vertical",
                            color: "silver",
                            shape: "pill",
                            label: "checkout",
                          }}
                          disabled={isPaymentProcessing}
                          createOrder={async () => {
                            setPaymentError(null);
                            const order = await createPaypalOrder({ data: paypalCheckoutData });

                            return order.id;
                          }}
                          onApprove={async (data) => {
                            if (!data.orderID) {
                              setPaymentError("PayPal не вернул номер заказа. Попробуйте еще раз.");
                              return;
                            }

                            setIsPaymentProcessing(true);
                            setPaymentError(null);

                            try {
                              await capturePaypalOrder({ data: { orderId: data.orderID } });
                              clear();
                              navigate({ to: "/order/success" });
                            } catch (error) {
                              setPaymentError(
                                error instanceof Error
                                  ? error.message
                                  : "Не удалось подтвердить оплату PayPal. Попробуйте еще раз.",
                              );
                            } finally {
                              setIsPaymentProcessing(false);
                            }
                          }}
                          onCancel={() => {
                            setPaymentError("Оплата PayPal была отменена.");
                          }}
                          onError={(error) => {
                            setPaymentError(
                              error instanceof Error
                                ? error.message
                                : "PayPal временно недоступен. Попробуйте еще раз.",
                            );
                          }}
                        />
                      )}
                      <PayPalButtons
                        fundingSource={FUNDING.CARD}
                        style={{ layout: "vertical", color: "black", shape: "pill", label: "pay" }}
                        disabled={isPaymentProcessing}
                        createOrder={async () => {
                          setPaymentError(null);
                          const order = await createPaypalOrder({ data: paypalCheckoutData });

                          return order.id;
                        }}
                        onApprove={async (data) => {
                          if (!data.orderID) {
                            setPaymentError("PayPal не вернул номер заказа. Попробуйте еще раз.");
                            return;
                          }

                          setIsPaymentProcessing(true);
                          setPaymentError(null);

                          try {
                            await capturePaypalOrder({ data: { orderId: data.orderID } });
                            clear();
                            navigate({ to: "/order/success" });
                          } catch (error) {
                            setPaymentError(
                              error instanceof Error
                                ? error.message
                                : "Не удалось подтвердить оплату PayPal. Попробуйте еще раз.",
                            );
                          } finally {
                            setIsPaymentProcessing(false);
                          }
                        }}
                        onCancel={() => {
                          setPaymentError("Оплата PayPal была отменена.");
                        }}
                        onError={(error) => {
                          setPaymentError(
                            error instanceof Error
                              ? error.message
                              : "PayPal временно недоступен. Попробуйте еще раз.",
                          );
                        }}
                      />
                    </PayPalScriptProvider>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      clear();
                      navigate({ to: "/order/success" });
                    }}
                    className="h-12 w-full rounded-full bg-foreground text-sm font-medium text-background"
                  >
                    Подтвердить заказ · {formatPrice(totals.total)}
                  </button>
                )}
              </div>
            )}
          </div>

          <aside className="lg:col-span-5">
            <div className="space-y-6 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-border bg-surface p-8">
                <div className="flex items-center justify-between">
                  <h3 className="eyebrow">Заказ · {lines.length} позиций</h3>
                  <select
                    className="text-xs border border-border rounded-md bg-transparent p-1 text-ink-soft outline-none focus:border-foreground"
                    value={subscriptionTier}
                    onChange={(e) => setSubscriptionTier(e.target.value as SubscriptionTier)}
                  >
                    <option value="none">Без подписки</option>
                    <option value="silver">Silver</option>
                    <option value="gold">Gold</option>
                    <option value="platinum">Platinum</option>
                  </select>
                </div>
                <ul className="mt-6 space-y-4">
                  {lines.map(({ item, product }) => (
                    <li key={item.productId} className="flex gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-xl bg-background ring-1 ring-border">
                        <img
                          src={product.images[0]}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-1 items-start justify-between gap-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-xs text-ink-soft">× {item.quantity}</p>
                        </div>
                        <span className="tabular-nums">
                          {formatPrice(product.price * item.quantity)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                <dl className="mt-6 space-y-2 border-t border-border pt-6 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Сумма товаров</dt>
                    <dd className="tabular-nums">{formatPrice(totals.baseSubtotal)}</dd>
                  </div>

                  {subscriptionTier !== "none" && (
                    <div className="flex justify-between">
                      <dt className="text-ink-soft">Скидка ({subscriptionTier.toUpperCase()})</dt>
                      <dd className="tabular-nums">− {formatPrice(totals.discount)}</dd>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <dt className="text-ink-soft">НДС (16%)</dt>
                    <dd className="tabular-nums">{formatPrice(totals.vat)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-soft">Доставка (+10%)</dt>
                    <dd className="tabular-nums">
                      {totals.delivery === 0 ? "Бесплатно" : formatPrice(totals.delivery)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
                  <span className="text-sm font-medium text-foreground">Итоговая сумма</span>
                  <span className="font-serif text-2xl tabular-nums">
                    {formatPrice(totals.total)}
                  </span>
                </div>
              </div>

              {/* Smart Savings Sidebar snippet */}
              {subscriptionTier !== "none" && totals.savings > 0 && (
                <div className="relative rounded-3xl border border-white/10 bg-surface/80 p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] backdrop-blur-md">
                  <div className="absolute -top-3.5 left-8 flex justify-center">
                    <span className="inline-flex items-center gap-1 rounded-full border border-foreground/10 bg-surface px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur-md">
                      <ShieldCheck className="size-3.5 fill-foreground text-foreground" />
                      Smart Savings
                    </span>
                  </div>
                  <h4 className="mt-2 font-serif text-xl text-foreground">Умная экономия</h4>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed">
                    Будучи участником подписки <b>{subscriptionTier.toUpperCase()}</b>, вы избегаете
                    дополнительных наценок на доставку и получаете закрытую скидку.
                  </p>

                  <dl className="mt-5 space-y-2 border-l-2 border-foreground/10 pl-4 text-sm">
                    <div className="flex justify-between text-ink-soft">
                      <dt>Без подписки:</dt>
                      <dd className="line-through">{formatPrice(totals.guestTotal)}</dd>
                    </div>
                    <div className="flex justify-between font-medium text-foreground">
                      <dt>С вашей подпиской:</dt>
                      <dd>{formatPrice(totals.total)}</dd>
                    </div>
                  </dl>

                  <div className="mt-6 rounded-2xl bg-foreground/5 p-4 text-center">
                    <p className="text-sm font-medium text-foreground">
                      Ваша экономия с подпиской:
                      <br />
                      <span className="text-lg font-serif">{formatPrice(totals.savings)}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
