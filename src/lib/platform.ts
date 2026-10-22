import { useEffect, useState } from "react";
import { useUi, displayMoney } from "./ui";
export const API =
  import.meta.env["VITE_AGAS_API_URL"] || (import.meta.env.DEV ? "http://localhost:4000" : "");
export type User = {
  guest?: boolean;
  id: string;
  email: string;
  name: string;
  role: string;
  supplierId: string | null;
  supplierName: string | null;
};
export type CatalogItem = {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  brand: string;
  price_minor: number;
  stock: number;
  image?: string;
  legacy?: boolean;
  supplier_id: string;
  published: boolean;
  iso?: string;
  document?: string;
  invoiceRef?: string;
};
export type Invoice = {
  provisional?: boolean;
  id: string;
  number: string;
  status: string;
  createdAt: string;
  totalMinor: number;
  subtotalMinor: number;
  taxMinor: number;
  deliveryMinor: number;
  vatLabel: string;
  currency: string;
  buyer: Record<string, string>;
  lines: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitMinor: number;
    totalMinor: number;
  }[];
  versions: { version: number }[];
};
export type PlatformConfig = {
  provisional?: boolean;
  sellerReady: boolean;
  sellerName: string;
  deliveryMinor: number;
  vatRate: number | null;
  emailReady: boolean;
};
export const money = displayMoney;
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(API + "/api" + path, {
      ...init,
      credentials: "include",
      headers: {
        ...(!(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error("Нет соединения с сервером. Проверьте подключение и попробуйте позже");
  }
  const data = await response.json().catch(() => ({ error: "Не удалось прочитать ответ сервера" }));
  if (!response.ok) throw new Error(data.error || "Не удалось выполнить действие");
  return data;
}
export function useResource<T>(path: string, initial: T) {
  useUi();
  const [data, setData] = useState<T>(initial),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let live = true;
    setLoading(true);
    api<T>(path)
      .then((v) => {
        if (live) {
          setData(v);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [path, revision]);
  return { data, error, loading, reload: () => setRevision((v) => v + 1) };
}
