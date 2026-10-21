import { ShieldCheck, Truck, Wrench, RotateCcw, Headphones, Lock } from "lucide-react";

const items = [
  {
    icon: ShieldCheck,
    title: "Гарантия 3 года",
    text: "Расширенная гарантия на электронику и установку.",
  },
  {
    icon: Truck,
    title: "Доставка за 1 день",
    text: "По Астане — день в день. По Казахстану — 2–4 дня.",
  },
  {
    icon: Wrench,
    title: "Профессиональный монтаж",
    text: "Сертифицированные инженеры AGAS у вас дома.",
  },
  {
    icon: RotateCcw,
    title: "Возврат 30 дней",
    text: "Без объяснения причин. Заберём бесплатно.",
  },
  {
    icon: Lock,
    title: "Безопасная оплата",
    text: "Kaspi, Visa, MasterCard и оплата при получении.",
  },
  {
    icon: Headphones,
    title: "Поддержка 24/7",
    text: "Инженер на связи в любое время суток.",
  },
];

export function TrustSignals() {
  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-3xl bg-border md:grid-cols-2 lg:grid-cols-3">
      {items.map(({ icon: Icon, title, text }) => (
        <div key={title} className="bg-background p-8">
          <Icon className="size-6 text-foreground" strokeWidth={1.4} />
          <h4 className="mt-6 text-base font-medium tracking-tight text-foreground">{title}</h4>
          <p className="mt-2 text-sm text-ink-soft text-pretty">{text}</p>
        </div>
      ))}
    </div>
  );
}
