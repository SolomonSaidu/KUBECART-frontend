import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { checkoutSchema } from "../lib/schemas";
import { createOrder } from "../services/orders";
import { initializePayment } from "../services/payments";
import { useCartStore } from "../store/cartStore";
import { absoluteUrl, createIdempotencyKey, formatDate, formatMoney } from "../lib/format";
import { clearPendingOrder, getPendingOrder, savePendingOrder } from "../lib/pendingOrder";
import ProductImage from "../components/ui/ProductImage";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { EmptyState } from "../components/ui/DataState";

function ApiIssues({ issues }) {
  if (!Array.isArray(issues) || issues.length === 0) return null;
  return (
    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
      {issues.map((issue, index) => (
        <li key={`${issue.path?.join?.(".") || "issue"}-${index}`}>
          {issue.path?.length ? `${issue.path.join(".")}: ` : ""}
          {issue.message || "Invalid value"}
        </li>
      ))}
    </ul>
  );
}

export default function CheckoutPage() {
  useDocumentTitle("Checkout");
  const queryClient = useQueryClient();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const replaceItems = useCartStore((state) => state.replaceItems);

  const [createdOrder, setCreatedOrder] = useState(null);
  const idempotencyKey = useRef(createIdempotencyKey());

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { email: "", phone: "", shippingAddress: "" },
  });

  const createMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: (response) => {
      const order = response?.data;
      if (!order) return;
      const cartSnapshot = items.map((item) => ({ ...item }));
      setCreatedOrder(order);
      savePendingOrder(order, cartSnapshot);
      clearCart();
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });

  const payMutation = useMutation({
    mutationFn: initializePayment,
    onSuccess: (response) => {
      const authorizationUrl = response?.data?.authorizationUrl;
      if (!authorizationUrl || !/^https?:\/\//i.test(authorizationUrl)) {
        throw new Error("The payment provider did not return a valid checkout link.");
      }
      window.location.assign(authorizationUrl);
    },
  });

  function submitOrder(values) {
    if (items.length === 0) return;
    createMutation.mutate({
      ...values,
      items,
      idempotencyKey: idempotencyKey.current,
    });
  }

  function payNow() {
    if (!createdOrder) return;
    const callback = new URL(absoluteUrl("/payment/callback"));
    callback.searchParams.set("orderReference", createdOrder.reference);
    payMutation.mutate({
      orderReference: createdOrder.reference,
      callbackUrl: callback.toString(),
    });
  }

  function startFreshOrder() {
    const pending = getPendingOrder();
    if (Array.isArray(pending?.cartItems) && pending.cartItems.length > 0) {
      replaceItems(pending.cartItems);
    }
    clearPendingOrder();
    setCreatedOrder(null);
    createMutation.reset();
    payMutation.reset();
    idempotencyKey.current = createIdempotencyKey();
  }

  if (items.length === 0 && !createdOrder) {
    return (
      <main className="page-container py-16">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add products to your cart before starting checkout."
          action={
            <Button as={Link} to="/products" size="lg">
              Browse products
            </Button>
          }
        />
      </main>
    );
  }

  const activeItems = createdOrder
    ? createdOrder.items.map((item) => ({
        key: item.id,
        name: item.productName,
        quantity: item.quantity,
        unitPriceKobo: item.unitPriceKobo,
        imageUrl: null,
      }))
    : items.map((item) => ({
        key: item.productId,
        name: item.name,
        quantity: item.quantity,
        unitPriceKobo: item.unitPriceKobo,
        imageUrl: item.imageUrl,
      }));

  const subtotal = createdOrder
    ? createdOrder.subtotalKobo
    : items.reduce((sum, item) => sum + item.unitPriceKobo * item.quantity, 0);
  const reservation = createdOrder?.reservations?.find((item) => item.status === "ACTIVE");
  const payError = payMutation.error;
  const createError = createMutation.error;
  const reservationExpired = payError?.status === 410;
  const alreadyPaid = payError?.status === 400 && /paid/i.test(payError.message || "");

  return (
    <main className="py-10">
      <div className="page-container">
        <div className="mb-7">
          <span className="eyebrow">Secure guest checkout</span>
          <h1 className="mt-3 text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold tracking-[-0.06em]">
            {createdOrder ? "Review and pay" : "Delivery and payment"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            No customer account is required. KubeCart confirms stock, pricing, delivery, and the
            final total on the server before creating your order.
          </p>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            {!createdOrder && (
              <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
                <h2 className="text-xl font-extrabold tracking-tight">Delivery details</h2>
                <p className="mt-1 text-sm text-muted">
                  We only collect the contact and delivery details supported by the checkout API.
                </p>

                <form onSubmit={handleSubmit(submitOrder)} className="mt-6 space-y-5" noValidate>
                  <div>
                    <label htmlFor="checkout-email" className="field-label">
                      Email address
                    </label>
                    <input
                      id="checkout-email"
                      type="email"
                      autoComplete="email"
                      className="field-input"
                      placeholder="you@example.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "checkout-email-error" : undefined}
                      {...register("email")}
                    />
                    {errors.email && (
                      <p id="checkout-email-error" className="field-error">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-phone" className="field-label">
                      Nigerian phone number
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      autoComplete="tel"
                      className="field-input"
                      placeholder="+234 801 234 5678"
                      aria-invalid={Boolean(errors.phone)}
                      aria-describedby={errors.phone ? "checkout-phone-error" : "checkout-phone-help"}
                      {...register("phone")}
                    />
                    {errors.phone ? (
                      <p id="checkout-phone-error" className="field-error">
                        {errors.phone.message}
                      </p>
                    ) : (
                      <p id="checkout-phone-help" className="mt-1.5 text-xs text-muted">
                        Use a number our delivery team can reach, including the country code.
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="checkout-address" className="field-label">
                      Full delivery address
                    </label>
                    <textarea
                      id="checkout-address"
                      rows={4}
                      autoComplete="street-address"
                      className="field-input resize-y"
                      placeholder="Street, area, city, state, and any delivery landmark"
                      aria-invalid={Boolean(errors.shippingAddress)}
                      aria-describedby={
                        errors.shippingAddress ? "checkout-address-error" : "checkout-address-help"
                      }
                      {...register("shippingAddress")}
                    />
                    {errors.shippingAddress ? (
                      <p id="checkout-address-error" className="field-error">
                        {errors.shippingAddress.message}
                      </p>
                    ) : (
                      <p id="checkout-address-help" className="mt-1.5 text-xs text-muted">
                        Delivery is currently fulfilled in Nigeria. Enter a complete local address.
                      </p>
                    )}
                  </div>

                  {createError && (
                    <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-bold">We could not create this order</p>
                          <p className="mt-1">{createError.message}</p>
                          <ApiIssues issues={createError.issues} />
                          {createError.status === 409 && (
                            <p className="mt-2">
                              Stock may have changed. Return to your{" "}
                              <Link to="/cart" className="font-bold underline">
                                cart
                              </Link>{" "}
                              to review quantities, then try again.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button type="submit" size="lg" className="w-full" loading={isSubmitting || createMutation.isPending}>
                    Create order and continue
                    <ArrowRight size={18} aria-hidden="true" />
                  </Button>
                  <p className="text-center text-xs leading-relaxed text-muted">
                    Submitting creates an order and reserves stock. Payment is only taken on the
                    next step through Paystack.
                  </p>
                </form>
              </section>
            )}

            {createdOrder && (
              <>
                <section className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-7">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <div>
                      <h2 className="text-lg font-extrabold tracking-tight">Order created</h2>
                      <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">
                        Order <strong>{createdOrder.reference}</strong> was created on the server.
                        Stock is reserved; complete payment to confirm the order.
                      </p>
                      {reservation?.expiresAt && (
                        <p className="mt-2 text-xs font-semibold text-emerald-900/70">
                          Reservation expires {formatDate(reservation.expiresAt)} if payment is not
                          completed.
                        </p>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="eyebrow-dark">Payment</span>
                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <h2 className="text-2xl font-extrabold tracking-tight">
                          Pay with Paystack
                        </h2>
                        <span className="inline-flex shrink-0 items-center rounded-lg bg-deep px-2.5 py-1.5">
                          <img
                            src="/paystack-logo.svg"
                            alt="Paystack"
                            width="140"
                            height="25"
                            className="h-4 w-auto"
                          />
                        </span>
                      </div>
                    </div>
                    <Badge tone="green">Secure</Badge>
                  </div>

                  <div className="mt-5 rounded-2xl border border-line bg-[#fbfcff] p-4">
                    <div className="flex items-start gap-3">
                      <CreditCard size={21} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                      <div>
                        <p className="font-bold">Card payment via Paystack</p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          You will be redirected to Paystack to complete payment. KubeCart never
                          collects or stores card details. Your order is only treated as paid after
                          the server verifies the Paystack transaction.
                        </p>
                      </div>
                    </div>
                  </div>

                  {payError && (
                    <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-bold">
                            {reservationExpired
                              ? "Your stock reservation expired"
                              : alreadyPaid
                                ? "This order is already paid"
                                : "Payment could not be started"}
                          </p>
                          <p className="mt-1">{payError.message}</p>
                          {reservationExpired && (
                            <p className="mt-2">
                              Create a new order to reserve stock again. Your cart items can be
                              restored below.
                            </p>
                          )}
                          {alreadyPaid && (
                            <Link
                              to={`/order/${createdOrder.reference}`}
                              className="mt-2 inline-block font-bold underline"
                            >
                              View order status
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={payNow}
                    size="lg"
                    className="mt-5 w-full"
                    loading={payMutation.isPending}
                  >
                    <LockKeyhole size={18} aria-hidden="true" />
                    {payMutation.isPending
                      ? "Redirecting to Paystack"
                      : `Pay ${formatMoney(createdOrder.totalKobo, { decimals: 2 })}`}
                  </Button>

                  {reservationExpired && (
                    <Button variant="secondary" onClick={startFreshOrder} className="mt-3 w-full">
                      <RotateCcw size={16} aria-hidden="true" />
                      Restore cart and start a new order
                    </Button>
                  )}

                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
                    <ShieldCheck size={14} aria-hidden="true" />
                    Payment status is verified by the KubeCart server after Paystack redirects back.
                  </div>
                </section>

                <section className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-7">
                  <h2 className="text-lg font-extrabold tracking-tight">Delivery details</h2>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Email</dt>
                      <dd className="mt-1 break-all font-medium">{createdOrder.email}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">Phone</dt>
                      <dd className="mt-1 font-medium">{createdOrder.phone}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Shipping address
                      </dt>
                      <dd className="mt-1 leading-relaxed">{createdOrder.shippingAddress}</dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-muted">
                    Delivery details cannot be edited after an order is created. Contact support if
                    they need to be changed.
                  </p>
                </section>
              </>
            )}
          </div>

          <aside className="rounded-3xl border border-line bg-white p-5 shadow-soft sm:p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold tracking-tight">Order summary</h2>
              {createdOrder && <Badge status={createdOrder.paymentStatus} />}
            </div>

            <ul className="mt-4 divide-y divide-line">
              {activeItems.map((item) => (
                <li key={item.key} className="flex items-center gap-3 py-3">
                  <ProductImage
                    src={item.imageUrl}
                    alt=""
                    className="h-14 w-14 shrink-0 rounded-xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Qty {item.quantity} · {formatMoney(item.unitPriceKobo, { decimals: 2 })} each
                    </p>
                  </div>
                  <span className="text-sm font-bold">
                    {formatMoney(item.unitPriceKobo * item.quantity, { decimals: 2 })}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-4 text-muted">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-ink">{formatMoney(subtotal, { decimals: 2 })}</dd>
              </div>
              <div className="flex justify-between gap-4 text-muted">
                <dt>Delivery</dt>
                <dd className="text-right font-semibold text-ink">
                  {createdOrder
                    ? formatMoney(createdOrder.deliveryFeeKobo, { decimals: 2 })
                    : "Calculated by server"}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
                <dt className="font-extrabold text-ink">
                  {createdOrder ? "Total" : "Estimated subtotal"}
                </dt>
                <dd className="font-extrabold text-ink">
                  {formatMoney(createdOrder ? createdOrder.totalKobo : subtotal, { decimals: 2 })}
                </dd>
              </div>
            </dl>

            {createdOrder && (
              <div className="mt-4 rounded-2xl bg-page p-3.5 text-xs leading-relaxed text-muted">
                <p>
                  Order reference: <strong className="text-ink">{createdOrder.reference}</strong>
                </p>
                <p className="mt-1">
                  Amounts above come directly from the server order response. Total:{" "}
                  {formatMoney(createdOrder.totalKobo, { decimals: 2 })}.
                </p>
              </div>
            )}

            <div className="mt-5 space-y-2 text-xs text-muted">
              <p className="flex items-start gap-2">
                <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                Paystack handles your card details.
              </p>
              <p className="flex items-start gap-2">
                <ShoppingBag size={14} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                Stock is reserved when the order is created.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
