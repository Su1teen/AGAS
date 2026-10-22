import { products, type Product } from "@/data/products";
import { api, useResource, type CatalogItem } from "./platform";
export function catalogProduct(p: CatalogItem): Product {
  const legacy = products.find((v) => v.id === p.id);
  if (legacy)
    return {
      ...legacy,
      name: p.name,
      description: p.description,
      price: p.price_minor / 100,
      subscriptionPrice: p.price_minor / 100,
      inStock: p.stock > 0,
    };
  return {
    id: p.id,
    slug: p.id,
    name: p.name,
    brand: p.brand || "Поставщик AGAS",
    group: "b2b",
    collection: "Поставщики AGAS",
    tagline: p.description.slice(0, 160),
    description: p.description,
    category: "supplier",
    categoryLabel: p.category,
    subcategory: "supplier",
    subcategoryLabel: p.category,
    price: p.price_minor / 100,
    subscriptionPrice: p.price_minor / 100,
    rating: 0,
    reviewsCount: 0,
    inStock: p.stock > 0,
    images: p.image ? [p.image] : ["/product-placeholder.svg"],
    specs: {
      Артикул: p.sku,
      ...(p.iso ? { "ISO / сертификат": p.iso } : {}),
      ...(p.invoiceRef ? { "Документ поставки": p.invoiceRef } : {}),
    },
    features: [],
    compatibility: [],
    highlights: [p.sku, p.category],
    protocols: [],
    functions: [],
    sourceUrl: p.document || "",
  };
}
export function useProducts() {
  const resource = useResource<CatalogItem[]>("/catalog", []);
  return {
    ...resource,
    products: resource.loading || resource.error ? products : resource.data.map(catalogProduct),
  };
}
export async function loadProduct(slug: string) {
  const legacy = products.find((p) => p.slug === slug);
  try {
    const id = legacy?.id || slug;
    const serverCatalog = (
      globalThis as { __AGAS_PUBLIC_CATALOG__?: (id: string) => Promise<Response> }
    ).__AGAS_PUBLIC_CATALOG__;
    if (typeof window === "undefined" && serverCatalog) {
      const response = await serverCatalog(id);
      if (!response.ok) throw new Error("Товар не найден");
      return catalogProduct(await response.json());
    }
    return catalogProduct(await api<CatalogItem>(`/catalog/${encodeURIComponent(id)}`));
  } catch (e) {
    if (legacy) return legacy;
    throw e;
  }
}
