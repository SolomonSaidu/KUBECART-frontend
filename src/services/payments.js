import { request } from "./client";

export function initializePayment({ orderReference, callbackUrl }) {
  return request("/payments/initialize", {
    method: "POST",
    body: { orderReference, callbackUrl },
  });
}

export function verifyPayment(reference) {
  return request(`/payments/verify/${encodeURIComponent(reference)}`);
}
