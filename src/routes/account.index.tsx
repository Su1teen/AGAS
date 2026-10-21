import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Award, Heart, Package, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/account/")({
  component: AccountIndex,
});

const monthlyData = [
  { month: "Мар", total: 45000 },
  { month: "Апр", total: 125000 },
  { month: "Май", total: 62000 },
  { month: "Июн", total: 215000 },
  { month: "Июл", total: 86500 },
  { month: "Авг", total: 230000 },
];

const monthlyConfig = {
  total: { label: "Сумма", color: "oklch(0.48 0.015 65)" },
} satisfies ChartConfig;

const categoryData = [
  { category: "Свет", amount: 285000 },
  { category: "Защита", amount: 215000 },
  { category: "Климат", amount: 126000 },
  { category: "Аудио", amount: 98000 },
  { category: "Управление", amount: 39500 },
];

const categoryConfig = {
  amount: { label: "Сумма", color: "oklch(0.48 0.015 65)" },
} satisfies ChartConfig;

const widgets = [
  { icon: Wallet, label: "Бонусы AGAS", value: "12 400 ₸", trend: "+1 200 за месяц", trendColor: "text-emerald-600" },
  { icon: Package, label: "Активные заказы", value: "2", trend: "В пути" },
  { icon: Award, label: "Статус", value: "AGAS Insider", trend: "До Gold: 3 заказа" },
  { icon: ShoppingBag, label: "Всего заказов", value: "8", trend: "За 2026 год" },
  { icon: TrendingUp, label: "Потрачено за год", value: formatPrice(763500), trend: "+12% к прошлому" },
  { icon: Heart, label: "Избранное", value: "12", trend: "товаров" },
];

function AccountIndex() {
  return (
    <div className="space-y-8">
      {/* A) Stats Widgets Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {widgets.map((w) => (
          <div key={w.label} className="group rounded-3xl border border-border bg-surface/60 p-6 transition-colors hover:bg-surface">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background text-foreground">
                <w.icon className="size-[18px]" strokeWidth={1.5} />
              </div>
              <span className="eyebrow">{w.label}</span>
            </div>
            <p className="font-serif text-3xl text-foreground">{w.value}</p>
            <p className={`mt-2 text-xs ${w.trendColor || 'text-ink-soft'}`}>{w.trend}</p>
          </div>
        ))}
      </div>

      {/* B) Charts Section */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Chart — Monthly Spending Area Chart */}
        <div className="rounded-3xl border border-border p-6">
          <div className="mb-6">
            <span className="eyebrow">Расходы</span>
            <h3 className="font-serif text-2xl">По месяцам</h3>
          </div>
          <ChartContainer config={monthlyConfig} className="h-[250px] w-full">
            <AreaChart data={monthlyData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-total)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-total)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tickMargin={8} fontSize={12} fill="var(--ink-soft)" />
              <YAxis hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="url(#fillTotal)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Right Chart — Category Breakdown Bar Chart */}
        <div className="rounded-3xl border border-border p-6">
          <div className="mb-6">
            <span className="eyebrow">Аналитика</span>
            <h3 className="font-serif text-2xl">По категориям</h3>
          </div>
          <ChartContainer config={categoryConfig} className="h-[250px] w-full">
            <BarChart layout="vertical" data={categoryData} margin={{ left: -20, right: 12, top: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="category" width={80} axisLine={false} tickLine={false} tickMargin={8} fontSize={12} fill="var(--ink-soft)" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={[0, 8, 8, 0]} barSize={24} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* C) Contact Details Section */}
      <div className="mt-8 rounded-3xl border border-border p-8">
        <h3 className="eyebrow">Контактные данные</h3>
        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 md:grid-cols-2">
          {[
            ["Имя", "Айгерим Касенова"],
            ["Email", "aigerim@agas.kz"],
            ["Телефон", "+7 707 000 12 34"],
            ["Город", "Астана"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-border py-3 text-sm">
              <dt className="text-ink-soft">{k}</dt>
              <dd className="font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
