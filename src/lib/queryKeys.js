export const queryKeys = {
  categories: ["categories"],
  category: (slug) => ["categories", slug],
  products: (params) => ["products", params],
  product: (slug) => ["product", slug],
  publicOrder: (reference) => ["public-order", reference],
  paymentVerify: (reference) => ["payment-verify", reference],
  admin: {
    me: ["admin", "me"],
    orders: (params) => ["admin", "orders", params],
    order: (reference) => ["admin", "order", reference],
  },
};
