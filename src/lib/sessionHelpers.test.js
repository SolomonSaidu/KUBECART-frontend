import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPendingOrder,
  getPendingOrder,
  savePendingOrder,
} from "./pendingOrder";
import {
  findTrackedProduct,
  getTrackedProducts,
  trackProduct,
  untrackProduct,
} from "./adminProductTracker";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

beforeEach(() => {
  vi.stubGlobal("sessionStorage", createStorage());
});

describe("pending order recovery", () => {
  const order = {
    reference: "KBC-ABCDEF123456",
    totalKobo: 4500000,
    currency: "NGN",
    createdAt: "2026-01-15T10:30:00.000Z",
  };
  const cartItems = [
    { productId: "p1", unitPriceKobo: 1500000, quantity: 3 },
  ];

  it("saves and reads the pending order snapshot", () => {
    savePendingOrder(order, cartItems);
    expect(getPendingOrder()).toEqual({ ...order, cartItems });
  });

  it("clears the snapshot", () => {
    savePendingOrder(order, cartItems);
    clearPendingOrder();
    expect(getPendingOrder()).toBeNull();
  });

  it("returns null for malformed stored data", () => {
    sessionStorage.setItem("kubecart:pending-order", "{bad json");
    expect(getPendingOrder()).toBeNull();
  });

  it("does nothing when storage is unavailable", () => {
    vi.stubGlobal("sessionStorage", undefined);
    expect(() => savePendingOrder(order, cartItems)).not.toThrow();
    expect(getPendingOrder()).toBeNull();
    expect(() => clearPendingOrder()).not.toThrow();
  });
});

describe("inactive product tracker", () => {
  it("tracks products newest-first without duplicates", () => {
    trackProduct({ id: "p1", slug: "one", name: "One" });
    trackProduct({ id: "p2", slug: "two", name: "Two" });
    trackProduct({ id: "p1", slug: "one", name: "One updated" });

    const tracked = getTrackedProducts();
    expect(tracked).toHaveLength(2);
    expect(tracked[0]).toMatchObject({ id: "p1", name: "One updated" });
    expect(findTrackedProduct("two")).toMatchObject({ id: "p2" });
    expect(findTrackedProduct("missing")).toBeNull();
  });

  it("removes tracked products and ignores products without an id", () => {
    trackProduct({ id: "p1", slug: "one" });
    trackProduct({ slug: "no-id" });
    untrackProduct("p1");

    expect(getTrackedProducts()).toHaveLength(0);
  });

  it("recovers from malformed storage", () => {
    sessionStorage.setItem("kubecart:tracked-products", "not-json");
    expect(getTrackedProducts()).toEqual([]);
  });
});
