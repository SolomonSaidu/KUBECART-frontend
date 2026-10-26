const KEY = "kubecart:pending-order";

export function savePendingOrder(order, cartItems = []) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(
    KEY,
    JSON.stringify({
      reference: order.reference,
      totalKobo: order.totalKobo,
      currency: order.currency,
      createdAt: order.createdAt,
      cartItems,
    })
  );
}

export function getPendingOrder() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const value = sessionStorage.getItem(KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

export function clearPendingOrder() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(KEY);
}
