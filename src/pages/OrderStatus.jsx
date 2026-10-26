import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowRight,
  CircleHelp,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { usePublicOrder } from "../features/orders/queries";
import { formatDate, formatMoney } from "../lib/format";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { EmptyState, ErrorState } from "../components/ui/DataState";
import { PageLoading } from "../components/ui/Spinner";

function OrderStatusPage() {
  const { reference = "" } = useParams();
  const navigate = useNavigate();
  const [lookup, setLookup] = useState("");
  const [lookupError, setLookupError] = useState("");

  const orderQuery = usePublicOrder(reference, { poll: true });
  useDocumentTitle(reference ? `Order ${reference}` : "Track Order");

  function submitLookup(event) {
    event.preventDefault();
    const value = lookup.trim();
    if (!value) {
      setLookupError("Enter the order reference from your confirmation.");
      return;
    }
    setLookupError("");
    navigate(`/order/${encodeURIComponent(value)}`);
  }

  const order = orderQuery.data;
  const itemCount = order?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <main className="py-10">
      <div className="page-container max-w-4xl">
        <div className="rounded-[30px] border border-line bg-deep p-6 text-white shadow-soft sm:p-9">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-white/70">
            Order tracking
          </span>
          <h1 className="mt-4 text-[clamp(2.1rem,4vw,3.2rem)] font-extrabold tracking-[-0.06em]">
            Follow your KubeCart order
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/65">
            Enter the order reference from checkout. This public view shows payment, order, and
            fulfillment status without exposing your contact or delivery details.
          </p>

          <form onSubmit={submitLookup} className="mt-6 flex flex-col gap-3 sm:flex-row" noValidate>
            <div className="relative flex-1">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                aria-hidden="true"
              />
              <label htmlFor="order-reference" className="sr-only">
                Order reference
              </label>
              <input
                id="order-reference"
                value={lookup}
                onChange={(event) => {
                  setLookup(event.target.value);
                  if (lookupError) setLookupError("");
                }}
                placeholder="e.g. KBC-A1B2C3D4E5F6"
                className="w-full rounded-full border border-white/15 bg-white/10 py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-white/35 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                autoComplete="off"
                aria-invalid={Boolean(lookupError)}
                aria-describedby={lookupError ? "order-reference-error" : undefined}
              />
            </div>
            <Button type="submit" size="lg" className="shrink-0">
              Track order
              <ArrowRight size={18} aria-hidden="true" />
            </Button>
          </form>
          {lookupError && (
            <p id="order-reference-error" className="mt-2 text-sm font-medium text-amber-300">
              {lookupError}
            </p>
          )}
        </div>

        {!reference && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Clock3,
                title: "Payment pending",
                text: "Unpaid orders hold stock only for the reservation window.",
              },
              {
                icon: Truck,
                title: "Delivery updates",
                text: "Fulfillment moves from unfulfilled to fulfilled once dispatched.",
              },
              {
                icon: ShieldCheck,
                title: "Server verified",
                text: "Payment status comes from KubeCart, never from a redirect alone.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-3xl border border-line bg-white p-5 shadow-soft">
                <Icon className="text-accent" size={22} aria-hidden="true" />
                <h2 className="mt-3 font-extrabold tracking-tight">{title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
              </div>
            ))}
          </div>
        )}

        {reference && orderQuery.isLoading && (
          <div className="mt-8 rounded-3xl border border-line bg-white shadow-soft">
            <PageLoading label="Loading order" />
          </div>
        )}

        {reference && orderQuery.isError && (
          <div className="mt-8 rounded-3xl border border-line bg-white shadow-soft">
            <ErrorState
              error={orderQuery.error}
              title={
                orderQuery.error?.status === 404 ? "Order not found" : "Could not load this order"
              }
              description={
                orderQuery.error?.status === 404
                  ? "Check the reference and try again. References are printed on your order confirmation."
                  : "The order service did not respond. Retry or contact customer care with your order reference."
              }
              onRetry={() => orderQuery.refetch()}
              retrying={orderQuery.isFetching}
            />
          </div>
        )}

        {reference && order && (
          <div className="mt-8 space-y-5">
            <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="eyebrow-dark">Order reference</span>
                  <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.05em]">
                    {order.reference}
                  </h2>
                  <p className="mt-1 text-sm text-muted">Placed {formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge status={order.paymentStatus} />
                  <Badge status={order.status} />
                  <Badge status={order.fulfillmentStatus} />
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-page p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
                    <ShoppingBag size={15} aria-hidden="true" />
                    Items
                  </div>
                  <p className="mt-2 text-2xl font-extrabold">{itemCount}</p>
                </div>
                <div className="rounded-2xl bg-page p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
                    <PackageCheck size={15} aria-hidden="true" />
                    Fulfillment
                  </div>
                  <p className="mt-2 text-lg font-extrabold capitalize">
                    {String(order.fulfillmentStatus || "—").toLowerCase()}
                  </p>
                </div>
                <div className="rounded-2xl bg-page p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted">
                    <Clock3 size={15} aria-hidden="true" />
                    Last checked
                  </div>
                  <p className="mt-2 text-sm font-bold">
                    {orderQuery.isFetching ? "Refreshing…" : "Just now"}
                  </p>
                </div>
              </div>

              {order.paymentStatus === "UNPAID" && (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                  <strong className="block font-bold">Payment not confirmed yet</strong>
                  If you have just paid, this page refreshes automatically for a short time. You can
                  also refresh or check again later. Contact customer care with your order reference
                  if payment is still not showing.
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => orderQuery.refetch()}
                  loading={orderQuery.isFetching}
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  Refresh status
                </Button>
                <Button as={Link} to="/contact" variant="ghost" size="sm">
                  <CircleHelp size={15} aria-hidden="true" />
                  Get help
                </Button>
              </div>
            </section>

            <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
              <h2 className="text-lg font-extrabold tracking-tight">Items</h2>
              <ul className="mt-4 divide-y divide-line">
                {order.items?.map((item, index) => (
                  <li
                    key={`${item.productName}-${index}`}
                    className="flex items-start justify-between gap-4 py-3.5 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="mt-0.5 text-xs text-muted">
                        {item.quantity} × {formatMoney(item.unitPriceKobo, { decimals: 2 })}
                      </p>
                    </div>
                    <strong className="shrink-0">
                      {formatMoney(item.unitPriceKobo * item.quantity, { decimals: 2 })}
                    </strong>
                  </li>
                ))}
              </ul>

              <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
                <div className="flex justify-between gap-4 text-muted">
                  <dt>Subtotal</dt>
                  <dd className="font-semibold text-ink">
                    {formatMoney(order.subtotalKobo, { decimals: 2 })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 text-muted">
                  <dt>Delivery</dt>
                  <dd className="font-semibold text-ink">
                    {formatMoney(order.deliveryFeeKobo, { decimals: 2 })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
                  <dt className="font-extrabold">Total</dt>
                  <dd className="font-extrabold">{formatMoney(order.totalKobo, { decimals: 2 })}</dd>
                </div>
              </dl>
            </section>

            <div className="rounded-2xl border border-line bg-white p-4 text-xs leading-relaxed text-muted">
              This public order view intentionally omits your email, phone number, delivery address,
              and payment internals. Keep your order reference private because anyone with it can
              view this status page.
            </div>
          </div>
        )}

        {!reference && (
          <div className="mt-6 rounded-3xl border border-line bg-white shadow-soft">
            <EmptyState
              icon={Search}
              title="No order selected"
              description="Enter an order reference above to see its current payment and fulfillment status."
              action={
                <Button as={Link} to="/products" variant="secondary">
                  Continue shopping
                </Button>
              }
            />
          </div>
        )}
      </div>
    </main>
  );
}

export default OrderStatusPage;
