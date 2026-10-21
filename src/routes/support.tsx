import { createFileRoute } from "@tanstack/react-router";
import { Container } from "@/components/site/Container";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Поддержка · AGAS" }] }),
  component: SupportPage,
});

const faqs = [
  {
    q: "Как происходит установка?",
    a: "Инженер AGAS приезжает в удобное время, монтирует устройства, настраивает сценарии и проводит обучение. Услуга бесплатна при заказе от 200 000 ₸.",
  },
  {
    q: "Что входит в гарантию 3 года?",
    a: "Полное обслуживание устройств, замена при заводском браке и приоритетная поддержка. Расходные материалы (батарейки) — отдельно.",
  },
  {
    q: "Работает ли система без интернета?",
    a: "Да. Хаб AGAS Omni S2 хранит сценарии локально и продолжает работать при отключении интернета. Только удалённый доступ требует сети.",
  },
  {
    q: "Совместима ли система с Apple Home?",
    a: "Все основные устройства AGAS поддерживают Matter и Apple HomeKit. На странице товара указана полная совместимость.",
  },
  {
    q: "Можно ли вернуть устройство?",
    a: "Да, в течение 30 дней без объяснения причин. Мы заберём устройство сами и вернём деньги в течение 3 банковских дней.",
  },
  {
    q: "Как связаться со специалистом?",
    a: "Чат на сайте, Telegram @agaskz, WhatsApp +7 707 000 00 00 — отвечаем 24/7.",
  },
];

function SupportPage() {
  return (
    <div className="py-12 md:py-16">
      <Container>
        <div className="mb-16 border-b border-border pb-10">
          <span className="eyebrow">Поддержка</span>
          <h1 className="mt-3 font-serif text-5xl text-foreground md:text-6xl text-balance">
            Мы рядом, когда нужно
          </h1>
          <p className="mt-6 max-w-[52ch] text-base text-ink-soft text-pretty">
            Сертифицированные инженеры AGAS отвечают на вопросы в чате, по телефону и в мессенджерах
            — круглосуточно.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-border md:grid-cols-3">
          {[
            ["Чат и Telegram", "@agaskz", "Среднее время ответа · 2 мин"],
            ["WhatsApp", "+7 707 000 00 00", "Голосовые сообщения принимаем"],
            ["Шоурум", "Астана, ул. Достык, 16", "Ежедневно 10:00 — 21:00"],
          ].map(([t, v, s]) => (
            <div key={t} className="bg-background p-8">
              <span className="eyebrow">{t}</span>
              <p className="mt-3 font-serif text-2xl text-foreground">{v}</p>
              <p className="mt-2 text-xs text-ink-soft">{s}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <span className="eyebrow">FAQ</span>
            <h2 className="mt-3 font-serif text-4xl text-foreground">Частые вопросы</h2>
          </div>
          <div className="lg:col-span-8">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-base font-medium text-foreground hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-ink-soft text-pretty">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </Container>
    </div>
  );
}
