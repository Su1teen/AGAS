import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/account/orders")({
  component: OrdersPage,
});

const orders = [
  { id: "AGAS-42081", date: "2026-04-12", dateLabel: "12 апреля 2026", status: "Доставлено" as const, total: 462000, category: "Аудио", items: ["AGAS SoundSphere Gen 2", "Tactile Light Module ×2"] },
  { id: "AGAS-42055", date: "2026-04-01", dateLabel: "1 апреля 2026", status: "Доставлено" as const, total: 185000, category: "Свет", items: ["Philips Hue White Color Ambiance ×3"] },
  { id: "AGAS-41902", date: "2026-03-28", dateLabel: "28 марта 2026", status: "В пути" as const, total: 215000, category: "Управление", items: ["Aqara Smart Wall Switch H1"] },
  { id: "AGAS-41850", date: "2026-03-15", dateLabel: "15 марта 2026", status: "Обработка" as const, total: 94000, category: "Климат", items: ["Aqara Thermostat S3"] },
  { id: "AGAS-41780", date: "2026-03-02", dateLabel: "2 марта 2026", status: "Доставлено" as const, total: 320000, category: "Защита", items: ["Aqara Smart Door Lock A100", "Aqara Camera Hub G3"] },
  { id: "AGAS-41750", date: "2026-02-05", dateLabel: "5 февраля 2026", status: "Доставлено" as const, total: 86500, category: "Свет", items: ["AGAS Glow Bulb ×4", "AGAS Mini Plug"] },
  { id: "AGAS-41600", date: "2026-01-20", dateLabel: "20 января 2026", status: "Возврат" as const, total: 55000, category: "Lifestyle", items: ["Xiaomi Robot Vacuum X20"] },
  { id: "AGAS-41520", date: "2025-12-15", dateLabel: "15 декабря 2025", status: "Доставлено" as const, total: 148000, category: "Аудио", items: ["AGAS SoundSphere Mini ×2"] },
];

type OrderStatus = "Доставлено" | "В пути" | "Обработка" | "Возврат";
const statuses: OrderStatus[] = ["Доставлено", "В пути", "Обработка", "Возврат"];
const orderCategories = [...new Set(orders.map(o => o.category))];

function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [amountRange, setAmountRange] = useState<[number, number]>([0, 500000]);

  const filtered = useMemo(() => {
    return orders.filter(o => {
      if (searchQuery && !o.id.toLowerCase().includes(searchQuery.toLowerCase()) && !o.items.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      if (categoryFilter && o.category !== categoryFilter) return false;
      if (o.total < amountRange[0] || o.total > amountRange[1]) return false;
      return true;
    });
  }, [searchQuery, statusFilter, categoryFilter, amountRange]);

  const activeFiltersCount = (statusFilter ? 1 : 0) + (categoryFilter ? 1 : 0) + (searchQuery ? 1 : 0) + (amountRange[0] > 0 || amountRange[1] < 500000 ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter(null);
    setCategoryFilter(null);
    setAmountRange([0, 500000]);
  };

  const statusColors = {
    "Доставлено": "bg-emerald-50 text-emerald-700 border-emerald-200",
    "В пути": "bg-foreground text-background border-foreground",
    "Обработка": "bg-amber-50 text-amber-700 border-amber-200",
    "Возврат": "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div>
      <div className="mb-6 rounded-3xl border border-border p-4">
        <div className="flex flex-col gap-4">
          {/* Top Row: Search & Filters Header */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-ink-soft" />
              <input
                type="text"
                placeholder="Поиск по ID или товару..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-foreground"
              />
            </div>
            <button className="flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium hover:bg-surface">
              <SlidersHorizontal className="size-4" />
              Фильтры
            </button>
          </div>

          {/* Filters Area */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Status */}
            <div>
              <p className="mb-2 text-xs font-medium text-ink-soft">Статус</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${!statusFilter ? "bg-foreground text-background border-foreground" : "border-border hover:bg-surface text-foreground"}`}
                >
                  Все
                </button>
                {statuses.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${statusFilter === s ? "bg-foreground text-background border-foreground" : "border-border hover:bg-surface text-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <p className="mb-2 text-xs font-medium text-ink-soft">Категория</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setCategoryFilter(null)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${!categoryFilter ? "bg-foreground text-background border-foreground" : "border-border hover:bg-surface text-foreground"}`}
                >
                  Все
                </button>
                {orderCategories.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategoryFilter(c)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${categoryFilter === c ? "bg-foreground text-background border-foreground" : "border-border hover:bg-surface text-foreground"}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <p className="mb-2 text-xs font-medium text-ink-soft">Сумма ({formatPrice(amountRange[0])} — {formatPrice(amountRange[1])})</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amountRange[0]}
                  onChange={(e) => setAmountRange([Number(e.target.value) || 0, amountRange[1]])}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
                  min={0}
                  max={500000}
                />
                <span className="text-ink-soft">-</span>
                <input
                  type="number"
                  value={amountRange[1]}
                  onChange={(e) => setAmountRange([amountRange[0], Number(e.target.value) || 500000])}
                  className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-sm"
                  min={0}
                  max={500000}
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-border pt-2">
              <span className="text-xs text-ink-soft">Активные фильтры:</span>
              {statusFilter && (
                <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs">
                  {statusFilter}
                  <button onClick={() => setStatusFilter(null)}><X className="size-3" /></button>
                </span>
              )}
              {categoryFilter && (
                <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs">
                  {categoryFilter}
                  <button onClick={() => setCategoryFilter(null)}><X className="size-3" /></button>
                </span>
              )}
              {(amountRange[0] > 0 || amountRange[1] < 500000) && (
                <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs">
                  Сумма
                  <button onClick={() => setAmountRange([0, 500000])}><X className="size-3" /></button>
                </span>
              )}
              {searchQuery && (
                <span className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs">
                  Поиск
                  <button onClick={() => setSearchQuery("")}><X className="size-3" /></button>
                </span>
              )}
              <button onClick={resetFilters} className="ml-auto text-xs text-ink-soft hover:text-foreground">
                Сбросить все
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 text-sm font-medium text-ink-soft">
        Найдено: {filtered.length} заказов
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface/60 p-16 text-center">
          <p className="text-ink-soft">Заказов не найдено</p>
          <button onClick={resetFilters} className="mt-4 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-surface">
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => (
            <article
              key={o.id}
              className="grid grid-cols-1 gap-6 rounded-3xl border border-border p-6 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <div className="flex flex-wrap items-baseline gap-3">
                  <span className="font-medium text-foreground">{o.id}</span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${statusColors[o.status] || ""}`}
                  >
                    {o.status}
                  </span>
                  <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-medium text-foreground">
                    {o.category}
                  </span>
                  <span className="text-xs text-ink-soft">{o.dateLabel}</span>
                </div>
                <p className="mt-2 text-sm text-ink-soft">{o.items.join(" · ")}</p>
              </div>
              <div className="flex items-center gap-6">
                <span className="font-serif text-2xl tabular-nums">{formatPrice(o.total)}</span>
                <button className="rounded-full border border-border px-4 py-2 text-xs font-medium hover:bg-surface">
                  Повторить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
