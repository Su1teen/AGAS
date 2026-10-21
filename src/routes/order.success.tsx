import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Container } from "@/components/site/Container";

export const Route = createFileRoute("/order/success")({
  head: () => ({ meta: [{ title: "Заказ оформлен · AGAS" }] }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const orderNumber = `AGAS-${Math.floor(Math.random() * 90000 + 10000)}`;

  return (
    <div className="py-20">
      <Container size="narrow">
        <div className="rounded-3xl border border-border bg-surface p-10 text-center md:p-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background">
            <Check className="size-7" strokeWidth={1.8} />
          </div>
          <span className="eyebrow mt-8 block">Заказ № {orderNumber}</span>
          <h1 className="mt-4 font-serif text-5xl text-foreground">Спасибо. Заказ принят.</h1>
          <p className="mt-5 text-base text-ink-soft text-pretty">
            Менеджер свяжется с вами в течение 30 минут, чтобы подтвердить детали доставки и время
            монтажа. Мы написали на ваш email — там детали и трек-номер.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/account/orders"
              className="inline-flex h-11 items-center rounded-full bg-foreground px-6 text-sm font-medium text-background"
            >
              История заказов
            </Link>
            <Link
              to="/"
              className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium text-foreground"
            >
              На главную
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
