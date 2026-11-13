import products from "../src/data/demo-products.json" with { type: "json" };

export const demoProducts = products.map((product) => ({
  ...product,
  demo: true,
  published: true,
  stock: 0,
  supplier_id: "agas",
}));
