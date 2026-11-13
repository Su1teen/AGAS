import { products, type Product } from "@/data/products";
import { categories, getCategory } from "@/data/categories";
import demoProducts from "@/data/demo-products.json";
import { api, ApiError, useResource, type CatalogItem } from "./platform";
export function catalogProduct(p: CatalogItem): Product {
  const legacy = products.find((v) => v.id === p.id);
  const category =
    getCategory(p.categorySlug || p.category) ||
    categories.find((value) =>
      [value.title, value.shortTitle].some(
        (label) => label.toLowerCase() === p.category.toLowerCase(),
      ),
    );
  if (legacy)
    return {
      ...legacy,
      name: p.name,
      description: p.description,
      price: p.price_minor / 100,
      subscriptionPrice: p.price_minor / 100,
      inStock: p.stock > 0,
      images: p.image === undefined ? legacy.images : [p.image || "/product-placeholder.svg"],
    };
  return {
    id: p.id,
    slug: p.id,
    name: p.name,
    brand: p.brand || "Поставщик AGAS",
    group: category?.group || "b2b",
    collection: p.demo ? "Демокаталог" : "Поставщики AGAS",
    tagline: p.description.slice(0, 160),
    description: p.description,
    category: category?.slug || "supplier",
    categoryLabel: category?.title || p.category,
    subcategory: p.subcategorySlug || "supplier",
    subcategoryLabel:
      category?.subcategories.find((value) => value.slug === p.subcategorySlug)?.title ||
      p.category,
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
    sourceUrl: p.sourceUrl || p.document || "",
    demo: Boolean(p.demo),
  };
}
const demoFallback = demoProducts.map((product) =>
  catalogProduct({ ...product, stock: 0, published: true, demo: true, supplier_id: "agas" }),
);
const fallbackProducts = [...products, ...demoFallback];
export function useProducts() {
  const resource = useResource<CatalogItem[]>("/catalog", []);
  return {
    ...resource,
    products:
      resource.loading || resource.error ? fallbackProducts : resource.data.map(catalogProduct),
  };
}
export async function loadProduct(slug: string) {
  const legacy = products.find((p) => p.slug === slug);
  const demo = demoFallback.find((product) => product.id === slug);
  try {
    const id = legacy?.id || slug;
    const serverCatalog = (
      globalThis as { __AGAS_PUBLIC_CATALOG__?: (id: string) => Promise<Response> }
    ).__AGAS_PUBLIC_CATALOG__;
    if (typeof window === "undefined" && serverCatalog) {
      const response = await serverCatalog(id);
      if (!response.ok) throw new ApiError("Товар не найден", response.status);
      return catalogProduct(await response.json());
    }
    return catalogProduct(await api<CatalogItem>(`/catalog/${encodeURIComponent(id)}`));
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) throw e;
    if (legacy || demo) return (legacy || demo)!;
    throw e;
  }
}
