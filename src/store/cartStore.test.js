import { beforeEach, describe, expect, it } from "vitest";
import { selectCartCount, selectCartSubtotalKobo, useCartStore } from "./cartStore";

const product = {
  id: "p1",
  slug: "smart-watch",
  name: "Smart Watch",
  imageUrl: "https://example.com/watch.jpg",
  priceKobo: 1500000,
  stock: 3,
};

beforeEach(() => {
  useCartStore.setState({ items: [] });
});

describe("cart store", () => {
  it("adds products and prevents exceeding stock", () => {
    useCartStore.getState().addItem(product, 2);
    useCartStore.getState().addItem(product, 5);

    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0].quantity).toBe(3);
    expect(selectCartCount(state)).toBe(3);
    expect(selectCartSubtotalKobo(state)).toBe(4500000);
  });

  it("caps quantity updates at available stock and removes at zero", () => {
    useCartStore.getState().addItem(product, 1);
    useCartStore.getState().setQuantity("p1", 9);
    expect(useCartStore.getState().items[0].quantity).toBe(3);

    useCartStore.getState().setQuantity("p1", 0);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("supports unknown stock and direct removal", () => {
    const madeToOrder = { ...product, id: "p2", stock: null };
    useCartStore.getState().addItem(madeToOrder, 7);
    expect(useCartStore.getState().items[0].quantity).toBe(7);

    useCartStore.getState().removeItem("p2");
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("replaces items for expired-order recovery and clears the cart", () => {
    const restored = [{ ...product, productId: "p1", unitPriceKobo: 1500000, quantity: 2 }];
    useCartStore.getState().replaceItems(restored);
    expect(useCartStore.getState().items).toEqual(restored);

    useCartStore.getState().clear();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("ignores invalid replacement data", () => {
    useCartStore.getState().replaceItems(null);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
