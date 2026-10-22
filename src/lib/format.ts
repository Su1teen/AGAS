import { displayMoney, useUi } from "./ui";
export const formatPrice = (value: number) => displayMoney(Math.round(value * 100));
export const formatNumber = (value: number) =>
  value.toLocaleString(useUi.getState().lang === "ru" ? "ru-RU" : "en-US");
