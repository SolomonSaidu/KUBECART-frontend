import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  CreditCard,
  History,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Truck,
  XCircle,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAdminOrder } from "../../features/admin/queries";
import { queryKeys } from "../../lib/queryKeys";
import { updateFulfillment } from "../../services/admin";
import { formatDate, formatMoney } from "../../lib/format";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/DataState";
import { PageLoading } from "../../components/ui/Spinner";

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
        <div className="mt-0.5 break-words font-medium">{children}</div>
      </div>
    </div>
  );
}

export default function AdminOrderDetailPage() {
  const { reference = "" } = useParams();
  useDocumentTitle(reference ? `Order ${reference}` : "Admin Order");
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const orderQuery = useAdminOrder(reference);
  const order = orderQuery.data;

  const fulfillmentMutation = useMutation({
    mutationFn: ({ status }) =>
      updateFulfillment(reference, { status, note: note.trim() || undefined }),
    onSuccess: (response, variables) => {
      setNote("");
      setConfirmCancel(false);
      setSuccessMessage(response?.message || `Fulfillment updated to ${variables.status}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.order(reference) });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
  });

  if (orderQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-white">
        <PageLoading label="Loading order" />
      </div>
    );
  }

  if (orderQuery.isError) {
    return (
      <div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to orders
        </Link>
        <div className="mt-5">
          <ErrorState
            error={orderQuery.error}
            title={
              orderQuery.error?.status === 404 ? "Order not found" : "Could not load this order"
            }
            onRetry={() => orderQuery.refetch()}
          />
        </div>
      </div>
    );
  }

  if (!order) return null;

  const stateError = fulfillmentMutation.error;
  const paid = order.paymentStatus === "PAID";
  const reviewBlocked = Boolean(order.requiresManualReview);
  const canProcess =
    paid && !reviewBlocked && order.fulfillmentStatus === "UNFULFILLED" && order.status !== "CANCELLED";
  const canFulfil =
    paid && !reviewBlocked && order.fulfillmentStatus === "PROCESSING" && order.status !== "CANCELLED";
  const canCancel =
    !paid &&
    ["UNFULFILLED", "PROCESSING"].includes(order.fulfillmentStatus) &&
    order.status !== "CANCELLED";

  return (
    <div>
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="eyebrow-dark">Order detail</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">
            {order.reference}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Created {formatDate(order.createdAt)} · Updated {formatDate(order.updatedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge status={order.paymentStatus} />
          <Badge status={order.status} />
          <Badge status={order.fulfillmentStatus} />
          {order.requiresManualReview && (
            <Badge tone="amber">
              <AlertTriangle size={12} className="mr-1" aria-hidden="true" />
              Manual review
            </Badge>
          )}
        </div>
      </div>

      {(reviewBlocked || order.requiresManualReview) && (
        <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-bold">Fulfilment is blocked pending payment reconciliation</p>
            <p className="mt-1">
              The API rejects fulfilment changes while manual review is required. Do not ask the
              customer to pay again. Resolve the payment review first.
            </p>
          </div>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          {successMessage}
        </div>
      )}

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1.55fr_0.85fr]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-extrabold tracking-tight">Customer and delivery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow icon={Mail} label="Email">
                {order.email}
              </InfoRow>
              <InfoRow icon={Phone} label="Phone">
                {order.phone}
              </InfoRow>
              <div className="sm:col-span-2">
                <InfoRow icon={MapPin} label="Shipping address">
                  {order.shippingAddress}
                </InfoRow>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold tracking-tight">Items</h2>
              <span className="text-xs font-bold text-muted">
                {order.items?.length || 0} line {order.items?.length === 1 ? "item" : "items"}
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-line text-sm">
                <thead className="text-left text-xs font-bold uppercase tracking-wide text-muted">
                  <tr>
                    <th className="py-2 pr-4">Product</th>
                    <th className="px-3 py-2 text-right">Unit</th>
                    <th className="px-3 py-2 text-right">Qty</th>
                    <th className="py-2 pl-3 text-right">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 font-medium">{item.productName}</td>
                      <td className="px-3 py-3 text-right text-muted">
                        {formatMoney(item.unitPriceKobo, { decimals: 2 })}
                      </td>
                      <td className="px-3 py-3 text-right">{item.quantity}</td>
                      <td className="py-3 pl-3 text-right font-bold">
                        {formatMoney(item.unitPriceKobo * item.quantity, { decimals: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
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

          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-accent" aria-hidden="true" />
              <h2 className="text-lg font-extrabold tracking-tight">Payment attempts</h2>
            </div>
            {order.payments?.length ? (
              <ul className="mt-4 space-y-3">
                {order.payments.map((payment) => (
                  <li key={payment.id} className="rounded-xl border border-line bg-page/50 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="break-all text-sm font-bold">{payment.reference}</p>
                      <Badge status={payment.status} />
                    </div>
                    <div className="mt-2 grid gap-1.5 text-xs text-muted sm:grid-cols-2">
                      <p>Gateway: {payment.gateway || "—"}</p>
                      <p>Amount: {formatMoney(payment.amountKobo, { decimals: 2 })}</p>
                      <p>Created: {formatDate(payment.createdAt)}</p>
                      <p>Updated: {formatDate(payment.updatedAt)}</p>
                      <p className="break-all sm:col-span-2">
                        External ID: {payment.externalId || "—"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No payment attempts recorded.</p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-extrabold tracking-tight">Reservations</h2>
            {order.reservations?.length ? (
              <ul className="mt-4 space-y-2.5">
                {order.reservations.map((reservation) => (
                  <li
                    key={reservation.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-page/60 px-3.5 py-2.5 text-sm"
                  >
                    <span className="break-all text-xs text-muted">{reservation.productId}</span>
                    <span className="font-semibold">Qty {reservation.quantity}</span>
                    <Badge status={reservation.status} />
                    <span className="text-xs text-muted">
                      Expires {formatDate(reservation.expiresAt)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No reservations on this order record.</p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <History size={18} className="text-accent" aria-hidden="true" />
              <h2 className="text-lg font-extrabold tracking-tight">Status history</h2>
            </div>
            {order.statusHistory?.length ? (
              <ol className="mt-4 space-y-4 border-l border-line pl-4">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="relative">
                    <span className="absolute -left-[1.32rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-accent" />
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted">
                        {entry.field}
                      </span>
                      <span className="font-semibold">
                        {entry.fromStatus || "—"} → {entry.toStatus}
                      </span>
                    </div>
                    {entry.note && <p className="mt-1 text-sm text-muted">{entry.note}</p>}
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(entry.createdAt)}
                      {entry.admin ? ` · ${entry.admin.name || entry.admin.email}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-muted">No status history recorded.</p>
            )}
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <Truck size={18} className="text-accent" aria-hidden="true" />
              <h2 className="text-lg font-extrabold tracking-tight">Fulfilment</h2>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-muted">Current state</span>
              <Badge status={order.fulfillmentStatus} />
            </div>

            <label htmlFor="fulfillment-note" className="field-label mt-4">
              Note (optional)
            </label>
            <textarea
              id="fulfillment-note"
              rows={3}
              maxLength={500}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="field-input resize-y"
              placeholder="e.g. Packed and handed to courier"
            />
            <p className="mt-1 text-right text-[0.7rem] text-muted">{note.length}/500</p>

            {stateError && (
              <div
                role="alert"
                className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                <p className="font-bold">Update rejected</p>
                <p className="mt-1">{stateError.message}</p>
                {stateError.status === 409 && (
                  <button
                    type="button"
                    onClick={() => {
                      fulfillmentMutation.reset();
                      orderQuery.refetch();
                    }}
                    className="mt-2 inline-flex items-center gap-1 font-bold underline"
                  >
                    <RefreshCw size={12} aria-hidden="true" />
                    Reload order state
                  </button>
                )}
              </div>
            )}

            <div className="mt-4 space-y-2">
              {canProcess && (
                <Button
                  className="w-full"
                  onClick={() => fulfillmentMutation.mutate({ status: "PROCESSING" })}
                  loading={fulfillmentMutation.isPending}
                >
                  <Clock3 size={16} aria-hidden="true" />
                  Mark as processing
                </Button>
              )}
              {canFulfil && (
                <Button
                  className="w-full"
                  onClick={() => fulfillmentMutation.mutate({ status: "FULFILLED" })}
                  loading={fulfillmentMutation.isPending}
                >
                  <CheckCircle2 size={16} aria-hidden="true" />
                  Mark as fulfilled
                </Button>
              )}

              {canCancel && !confirmCancel && (
                <Button
                  variant="outlineDanger"
                  className="w-full"
                  onClick={() => setConfirmCancel(true)}
                >
                  <XCircle size={16} aria-hidden="true" />
                  Cancel unpaid order
                </Button>
              )}
              {canCancel && confirmCancel && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                  <p className="text-xs font-semibold text-red-900">
                    This cancels the order, releases active reservations, and restores stock. It
                    cannot be undone.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1"
                      onClick={() => fulfillmentMutation.mutate({ status: "CANCELLED" })}
                      loading={fulfillmentMutation.isPending}
                    >
                      Confirm cancel
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmCancel(false)}
                    >
                      Keep
                    </Button>
                  </div>
                </div>
              )}

              {!canProcess && !canFulfil && !canCancel && (
                <p className="rounded-xl bg-page p-3 text-xs leading-relaxed text-muted">
                  {paid
                    ? order.fulfillmentStatus === "FULFILLED"
                      ? "This order is already fulfilled."
                      : reviewBlocked
                        ? "Fulfilment is blocked while payment review is required."
                        : "No fulfilment transition is available from the current state."
                    : order.status === "CANCELLED"
                      ? "This order was cancelled. Paid orders cannot be cancelled through this endpoint."
                      : order.fulfillmentStatus === "CANCELLED"
                        ? "This order is cancelled."
                        : "No fulfilment transition is available. Payment must be verified before processing."}
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-muted">
              Allowed path: unfulfilled → processing → fulfilled for paid orders. Unpaid orders may
              be cancelled from unfulfilled or processing. Direct jumps are rejected by the API.
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">Reference</h2>
            <p className="mt-2 break-all text-sm font-bold">{order.reference}</p>
            <p className="mt-3 break-all text-xs text-muted">
              Database ID: {order.id || "—"}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
