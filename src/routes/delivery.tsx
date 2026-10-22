// localized-ui
import { tr, useUi } from "@/lib/ui";
import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/site/Container";
import { TrustSignals } from "@/components/site/TrustSignals";
export const Route = createFileRoute("/delivery")({
  head: () => ({ meta: [{ title: "Доставка и оплата · AGAS" }] }),
  component: DeliveryPage,
});
function DeliveryPage() {
  useUi();
  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-16 border-b border-border pb-10">
          <span className="eyebrow">{tr("Сервис")}</span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl text-balance">
            {tr("Доставка и оплата без стресса")}
          </h1>
          <p className="mt-6 max-w-[52ch] text-base text-ink-soft text-pretty">
            {tr(
              "Мы делаем процесс прозрачным от момента оформления до установки. Без скрытых платежей, со временем доставки в двухчасовом интервале.",
            )}
          </p>
        </div>

        <div className="mb-20 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-3xl border border-border p-8">
            <h2 className="font-serif text-3xl text-foreground">{tr("Доставка")}</h2>
            <dl className="mt-8 divide-y divide-border border-y border-border">
              {tr(
                [
                  ["По Астане", "Сегодня или завтра · 2 500 ₸"],
                  ["По Казахстану", "2–4 дня · от 3 500 ₸"],
                  ["Бесплатно", "При заказе от 80 000 ₸"],
                  ["Самовывоз", "Шоурум ул. Достык, 16"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-4 text-sm">
                    <dt className="text-ink-soft">{tr(k)}</dt>
                    <dd className="font-medium text-foreground">{tr(v)}</dd>
                  </div>
                )),
              )}
            </dl>
          </div>
          <div className="rounded-3xl border border-border p-8">
            <h2 className="font-serif text-3xl text-foreground">{tr("Оплата")}</h2>
            <dl className="mt-8 divide-y divide-border border-y border-border">
              {tr(
                [
                  ["Kaspi", "QR · оплата по СНИП · рассрочка 0-0-12"],
                  ["Visa / MasterCard", "Безопасный платёж 3D-Secure"],
                  ["При получении", "Наличными или картой курьеру"],
                  ["Юридическим лицам", "Безналичный расчёт по счёту"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-4 text-sm">
                    <dt className="text-ink-soft">{tr(k)}</dt>
                    <dd className="text-right font-medium text-foreground">{tr(v)}</dd>
                  </div>
                )),
              )}
            </dl>
          </div>
        </div>

        <TrustSignals />
      </Container>
    </div>
  );
}
