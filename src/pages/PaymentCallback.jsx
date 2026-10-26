import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { verifyPayment } from "../services/payments";
import { queryKeys } from "../lib/queryKeys";
import { formatMoney } from "../lib/format";
import { clearPendingOrder, getPendingOrder } from "../lib/pendingOrder";
import { useCartStore } from "../store/cartStore";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { Spinner } from "../components/ui/Spinner";

export default function PaymentCallbackPage() {
  useDocumentTitle("Payment Status");
  const [searchParams] = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("trxref") || "";
  const pending = getPendingOrder();
  const orderReference = searchParams.get("orderReference") || pending?.reference || "";
  const clearCart = useCartStore((state) => state.clear);

  const verify = useQuery({
    queryKey: queryKeys.paymentVerify(reference),
    queryFn: () => verifyPayment(reference),
    enabled: Boolean(reference),
    retry: false,
    staleTime: Infinity,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    select: (response) => response?.data || null,
  });

  const result = verify.data;
  const order = result?.order;
  const paid = order?.paymentStatus === "PAID";
  const confirmed = paid && order?.status === "CONFIRMED";
  const needsReview =
    result?.isCancelledOrder ||
    order?.requiresManualReview ||
    result?.reconciliation?.requiresManualReview;
  const normalSuccess = confirmed && !needsReview;

  useEffect(() => {
    if (normalSuccess) {
      clearCart();
      clearPendingOrder();
    }
  }, [normalSuccess, clearCart]);

  const canRetryVerify =
    verify.isError && (!verify.error?.status || verify.error.status >= 500 || verify.error.status === 0);

  return (
    <main className="py-12">
      <div className="page-container max-w-3xl">
        <div className="rounded-[30px] border border-line bg-white p-6 text-center shadow-soft sm:p-10">
          {!reference && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600">
                <XCircle size={32} aria-hidden="true" />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.05em]">
                Payment reference missing
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
                Paystack did not return a payment reference. If you completed a payment, use your
                order reference to check its status or contact customer care.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {orderReference && (
                  <Button as={Link} to={`/order/${encodeURIComponent(orderReference)}`}>
                    View order status
                  </Button>
                )}
                <Button as={Link} to="/contact" variant="secondary">
                  Contact support
                </Button>
              </div>
            </>
          )}

          {reference && verify.isLoading && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/10">
                <Spinner size={30} />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.05em]">
                Verifying your payment
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
                We are asking the KubeCart server to verify the Paystack transaction. Please keep
                this page open. A redirect alone does not confirm payment.
              </p>
            </>
          )}

          {reference && verify.isError && (
            <>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-red-50 text-red-600">
                <XCircle size={32} aria-hidden="true" />
              </div>
              <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.05em]">
                Payment could not be confirmed
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
                {verify.error?.message || "The server could not verify this payment."}
              </p>
              {verify.error?.status === 404 && (
                <p className="mx-auto mt-2 max-w-xl text-sm text-muted">
                  This payment reference is not known to KubeCart. Check that you used the most
                  recent payment attempt.
                </p>
              )}
              {verify.error?.requestId && (
                <p className="mt-2 text-xs text-muted">Request ID: {verify.error.requestId}</p>
              )}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {canRetryVerify && (
                  <Button onClick={() => verify.refetch()} loading={verify.isFetching}>
                    <RefreshCw size={16} aria-hidden="true" />
                    Retry verification
                  </Button>
                )}
                {orderReference && (
                  <Button
                    as={Link}
                    to={`/order/${encodeURIComponent(orderReference)}`}
                    variant="secondary"
                  >
                    View order status
                  </Button>
                )}
                <Button as={Link} to="/contact" variant="ghost">
                  Contact support
                </Button>
              </div>
              <div className="mt-6 rounded-2xl border border-line bg-page p-4 text-left text-xs leading-relaxed text-muted">
                Do not create another payment for this order until you have checked its status.
                Support may need your order reference and Paystack payment reference.
              </div>
            </>
          )}

          {reference && verify.isSuccess && result && (
            <>
              {normalSuccess && (
                <>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-600 text-white">
                    <CheckCircle2 size={32} aria-hidden="true" />
                  </div>
                  <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.05em]">
                    Payment verified
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
                    Your payment was confirmed by the server and your order is now confirmed.
                    Thank you for shopping with KubeCart.
                  </p>
                </>
              )}

              {needsReview && (
                <>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-700">
                    <ShieldAlert size={32} aria-hidden="true" />
                  </div>
                  <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.05em]">
                    Payment received — review required
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
                    The server recorded payment, but this order needs manual review. Please contact
                    KubeCart customer care with your order and payment references. Do not make
                    another payment.
                  </p>
                </>
              )}

              {!normalSuccess && !needsReview && (
                <>
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100 text-amber-700">
                    <Clock3 size={32} aria-hidden="true" />
                  </div>
                  <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.05em]">
                    Payment still pending
                  </h1>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted">
                    The server has not marked this order as paid yet. Check the order status below
                    before trying again.
                  </p>
                </>
              )}

              <div className="mx-auto mt-6 max-w-md rounded-2xl border border-line bg-[#fbfcff] p-5 text-left">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">Order status</span>
                  <Badge status={order?.status} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">Payment status</span>
                  <Badge status={order?.paymentStatus} />
                </div>
                {order?.totalKobo !== undefined && (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm text-muted">Total</span>
                    <strong className="text-sm">{formatMoney(order.totalKobo, { decimals: 2 })}</strong>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">Order reference</span>
                  <strong className="text-sm">{order?.reference || orderReference || "—"}</strong>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-muted">Payment reference</span>
                  <strong className="break-all text-right text-xs">{reference}</strong>
                </div>
                {result.isAlreadyProcessed && (
                  <p className="mt-3 text-xs text-muted">
                    This payment was already processed. No duplicate charge was made by this check.
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {(order?.reference || orderReference) && (
                  <Button
                    as={Link}
                    to={`/order/${encodeURIComponent(order?.reference || orderReference)}`}
                  >
                    Track this order
                  </Button>
                )}
                {needsReview && (
                  <Button as={Link} to="/contact" variant="secondary">
                    Contact support
                  </Button>
                )}
                <Button as={Link} to="/products" variant="ghost">
                  Continue shopping
                </Button>
              </div>
            </>
          )}
        </div>

        {reference && (
          <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-muted">
            Payment status on this page comes from a server-side verification of the Paystack
            transaction. A Paystack redirect or URL parameter alone is never treated as proof of
            payment.
          </p>
        )}

        {!normalSuccess && verify.isSuccess && order && order.paymentStatus === "UNPAID" && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>
              The order is still unpaid. If you completed payment, wait a moment and refresh the
              order status. Contact support if it does not update.
            </span>
          </div>
        )}
      </div>
    </main>
  );
}
