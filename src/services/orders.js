import { request } from "./client";

export function createOrder({ email, phone, shippingAddress, items, idempotencyKey }) {
  return request("/checkout", {
    method: "POST",
    headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : {},
    body: {
      email,
      phone,
      shippingAddress,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    },
  });
}

export function getPublicOrder(reference) {
  return request(`/checkout/${encodeURIComponent(reference)}`);
}
