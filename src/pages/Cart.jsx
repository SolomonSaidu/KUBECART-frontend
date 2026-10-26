import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { selectCartCount, selectCartSubtotalKobo, useCartStore } from "../store/cartStore";
import { formatMoney } from "../lib/format";
import ProductImage from "../components/ui/ProductImage";
import QuantityStepper from "../components/ui/QuantityStepper";
import Button from "../components/ui/Button";
import { EmptyState } from "../components/ui/DataState";

export default function CartPage() {
  useDocumentTitle("Your Cart");
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const count = useCartStore(selectCartCount);
  const estimatedSubtotal = useCartStore(selectCartSubtotalKobo);

  if (items.length === 0) {
    return (
      <main className="page-container py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add a few products to your cart and they will appear here. Your cart is saved on this device."
          action={
            <Button as={Link} to="/products" size="lg">
              Start shopping
            </Button>
          }
        />
      </main>
    );
  }

  return (
    <main className="py-10">
      <div className="page-container">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Your cart</span>
            <h1 className="mt-3 text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold tracking-[-0.06em]">
              Items selected
            </h1>
          </div>
          <p className="text-sm text-muted">
            {count} {count === 1 ? "item" : "items"} in your cart
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7" aria-label="Cart items">
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.productId} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
                  <Link to={`/products/${item.slug}`} className="shrink-0">
                    <ProductImage
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-44 w-full rounded-2xl sm:h-[76px] sm:w-[76px]"
                    />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold leading-snug tracking-tight">
                      <Link to={`/products/${item.slug}`} className="hover:text-accent">
                        {item.name}
                      </Link>
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {formatMoney(item.unitPriceKobo, { decimals: 2 })} each
                    </p>
                    {item.stock !== null && item.stock !== undefined && (
                      <p className="mt-1 text-xs text-muted">
                        {item.stock > 0 ? `${item.stock} available` : "Currently unavailable"}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <QuantityStepper
                        value={item.quantity}
                        max={item.stock || undefined}
                        onChange={(next) => setQuantity(item.productId, next)}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted transition hover:text-red-600"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        Remove
                      </button>
                    </div>
                  </div>
                  <strong className="text-lg sm:min-w-28 sm:text-right">
                    {formatMoney(item.unitPriceKobo * item.quantity, { decimals: 2 })}
                  </strong>
                </li>
              ))}
            </ul>
          </section>

          <aside className="rounded-3xl border border-line bg-white p-6 shadow-soft lg:sticky lg:top-24">
            <span className="eyebrow-dark">Summary</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight">Order estimate</h2>
            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex justify-between gap-4 text-muted">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink">
                  {formatMoney(estimatedSubtotal, { decimals: 2 })}
                </dd>
              </div>
              <div className="flex justify-between gap-4 text-muted">
                <dt>Delivery</dt>
                <dd className="text-right font-semibold text-ink">Calculated by server</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-4 text-base">
                <dt className="font-bold text-ink">Estimated total</dt>
                <dd className="font-extrabold text-ink">
                  {formatMoney(estimatedSubtotal, { decimals: 2 })}+
                </dd>
              </div>
            </dl>
            <p className="mt-4 rounded-2xl bg-page p-3.5 text-xs leading-relaxed text-muted">
              The subtotal above uses saved cart prices for display only. The server recalculates
              all prices, stock, delivery, and the final total when you checkout.
            </p>
            <Button as={Link} to="/checkout" size="lg" className="mt-5 w-full">
              Continue to checkout
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
            <Button as={Link} to="/products" variant="ghost" className="mt-2 w-full">
              Continue shopping
            </Button>
          </aside>
        </div>
      </div>
    </main>
  );
}
