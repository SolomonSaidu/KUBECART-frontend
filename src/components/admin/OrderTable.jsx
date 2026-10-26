import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { formatDate, formatMoney } from "../../lib/format";
import Badge from "../ui/Badge";

export default function OrderTable({ orders = [] }) {
  return (
    <div>
      <div className="hidden overflow-hidden rounded-2xl border border-line md:block">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-page text-left text-xs font-bold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Fulfillment</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3" aria-label="Open" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {orders.map((order) => (
              <tr key={order.id || order.reference} className="align-top hover:bg-page/60">
                <td className="px-4 py-3.5">
                  <Link
                    to={`/admin/orders/${encodeURIComponent(order.reference)}`}
                    className="font-bold hover:text-accent"
                  >
                    {order.reference}
                  </Link>
                  <p className="mt-0.5 text-xs text-muted">{formatDate(order.createdAt)}</p>
                  {order.requiresManualReview && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[0.7rem] font-bold text-amber-700">
                      <AlertTriangle size={12} aria-hidden="true" />
                      Manual review
                    </p>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <p className="max-w-[220px] truncate">{order.email}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {order._count?.items ?? 0} {(order._count?.items ?? 0) === 1 ? "item" : "items"}
                  </p>
                </td>
                <td className="px-4 py-3.5">
                  <Badge status={order.paymentStatus} />
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-col items-start gap-1">
                    <Badge status={order.fulfillmentStatus} />
                    <Badge status={order.status} />
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right font-bold">
                  {formatMoney(order.totalKobo, { decimals: 2 })}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <Link
                    to={`/admin/orders/${encodeURIComponent(order.reference)}`}
                    className="inline-flex text-muted transition hover:text-accent"
                    aria-label={`Open ${order.reference}`}
                  >
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {orders.map((order) => (
          <Link
            key={order.id || order.reference}
            to={`/admin/orders/${encodeURIComponent(order.reference)}`}
            className="block rounded-2xl border border-line bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-bold">{order.reference}</p>
                <p className="mt-0.5 text-xs text-muted">{formatDate(order.createdAt)}</p>
              </div>
              <strong className="text-sm">{formatMoney(order.totalKobo, { decimals: 2 })}</strong>
            </div>
            <p className="mt-2 truncate text-sm text-muted">{order.email}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge status={order.paymentStatus} />
              <Badge status={order.fulfillmentStatus} />
              <Badge status={order.status} />
            </div>
            {order.requiresManualReview && (
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                <AlertTriangle size={13} aria-hidden="true" />
                Manual review required
              </p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
