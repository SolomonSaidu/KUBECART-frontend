import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const cartStorage = {
  getItem(name) {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(name);
  },
  setItem(name, value) {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(name, value);
  },
  removeItem(name) {
    if (typeof localStorage === "undefined") return;
    localStorage.removeItem(name);
  },
};

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      addItem(product, quantity = 1) {
        const qty = Math.max(1, Math.floor(Number(quantity) || 1));
        const rawStock = product.stock;
        const stock =
          rawStock === null || rawStock === undefined || rawStock === ""
            ? null
            : Number.isFinite(Number(rawStock))
              ? Number(rawStock)
              : null;
        const existing = get().items.find((item) => item.productId === product.id);
        set((state) => {
          if (existing) {
            const nextQty = stock === null ? existing.quantity + qty : Math.min(stock, existing.quantity + qty);
            return {
              items: state.items.map((item) =>
                item.productId === product.id ? { ...item, quantity: nextQty } : item
              ),
            };
          }
          const initialQty = stock === null ? qty : Math.min(stock, qty);
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                imageUrl: product.imageUrl || null,
                unitPriceKobo: Number(product.priceKobo) || 0,
                quantity: Math.max(1, initialQty),
                stock,
              },
            ],
          };
        });
      },
      setQuantity(productId, quantity) {
        const qty = Math.floor(Number(quantity) || 0);
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter((item) => item.productId !== productId)
              : state.items.map((item) =>
                  item.productId === productId
                    ? {
                        ...item,
                        quantity:
                          item.stock === null || item.stock === undefined
                            ? qty
                            : Math.min(qty, item.stock),
                      }
                    : item
                ),
        }));
      },
      removeItem(productId) {
        set((state) => ({
          items: state.items.filter((item) => item.productId !== productId),
        }));
      },
      replaceItems(items) {
        set({ items: Array.isArray(items) ? items : [] });
      },
      clear() {
        set({ items: [] });
      },
    }),
    {
      name: "kubecart:cart",
      version: 1,
      storage: createJSONStorage(() => cartStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);

export const selectCartCount = (state) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartSubtotalKobo = (state) =>
  state.items.reduce((sum, item) => sum + item.unitPriceKobo * item.quantity, 0);
