import { create } from "zustand";
import { persist } from "zustand/middleware";
import { english } from "./translations";
export type Fx = {
  kztPerUsd: number;
  asOf: string;
  source: string;
  sourceUrl: string;
  stale: boolean;
};
type Ui = {
  lang: "ru" | "en";
  currency: "KZT" | "USD";
  fx: Fx | null;
  setLang: (lang: "ru" | "en") => void;
  setCurrency: (currency: "KZT" | "USD") => void;
  setFx: (fx: Fx | null) => void;
};
export const useUi = create<Ui>()(
  persist(
    (set) => ({
      lang: "ru",
      currency: "KZT",
      fx: null,
      setLang: (lang) => set({ lang }),
      setCurrency: (currency) => set({ currency }),
      setFx: (fx) => set({ fx, ...(!fx ? { currency: "KZT" as const } : {}) }),
    }),
    {
      name: "agas-interface",
      skipHydration: true,
      partialize: (s) => ({ lang: s.lang, currency: s.currency }),
    },
  ),
);
export function tr<T>(value: T): T {
  if (typeof value !== "string" || useUi.getState().lang === "ru") return value;
  const clean = value.replace(/\s+/g, " ").trim();
  if (english[clean]) return english[clean] as T;
  for (const [ru, en] of Object.entries(english)) {
    if (!ru.includes("{{")) continue;
    const parts = ru.split(/\{\{\d+\}\}/);
    const pattern =
      "^" + parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("(.*?)") + "$";
    const match = clean.match(new RegExp(pattern));
    if (match) return en.replace(/\{\{(\d+)\}\}/g, (_, i) => match[Number(i) + 1] || "") as T;
  }
  return value;
}
export function displayMoney(minor: number) {
  const { lang, currency, fx } = useUi.getState();
  const unit = currency === "USD" && fx ? "USD" : "KZT";
  const amount = minor / 100 / (unit === "USD" ? fx!.kztPerUsd : 1);
  return new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US", {
    style: "currency",
    currency: unit,
    maximumFractionDigits: 2,
  }).format(amount);
}
