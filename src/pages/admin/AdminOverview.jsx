import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  CreditCard,
  Package,
  ShoppingBag,
  Truck,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAdminOrders } from "../../features/admin/queries";
import OrderTable from "../../components/admin/OrderTable";
import Button from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/DataState";
import { PageLoading } from "../../components/ui/Spinner";

function totalOf(query) {
  return query?.data?.pagination?.total;
}

function MetricCard({ label, value, hint, icon: Icon, tone = "default", to }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-line bg-white p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-ink/15"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={
            tone === "amber"
              ? "grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"
              : tone === "blue"
                ? "grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"
                : "grid h-10 w-10 place-items-center rounded-xl bg-page text-ink"
          }
        >
          <Icon size={19} aria-hidden="true" />
        </div>
        <ArrowRight
          size={16}
          className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink"
          aria-hidden="true"
        />
      </div>
      <p className="mt-5 text-3xl font-extrabold tracking-[-0.05em]">
        {value === undefined ? "—" : value}
      </p>
      <p className="mt-1 text-sm font-semibold">{label}</p>
      <p className="mt-0.5 text-xs text-muted">{hint}</p>
    </Link>
  );
}

export default function AdminOverviewPage() {
  useDocumentTitle("Admin Overview");
  const allQuery = useAdminOrders({ page: 1, limit: 1 });
  const unpaidQuery = useAdminOrders({ page: 1, limit: 1, paymentStatus: "UNPAID" });
  const reviewQuery = useAdminOrders({
    page: 1,
    limit: 1,
    requiresManualReview: "true",
  });
  const processingQuery = useAdminOrders({
    page: 1,
    limit: 1,
    fulfillmentStatus: "PROCESSING",
  });
  const recentQuery = useAdminOrders({ page: 1, limit: 6, sort: "newest" });

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow-dark">Operations</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Overview</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            A live snapshot from the admin order API. Counts use server pagination totals; there is
            no separate analytics endpoint.
          </p>
        </div>
        <div className="flex gap-2">
          <Button as={Link} to="/admin/orders" size="sm">
            All orders
          </Button>
          <Button as={Link} to="/admin/products/new" variant="secondary" size="sm">
            New product
          </Button>
        </div>
      </div>

      {allQuery.isError && (
        <div className="mt-6">
          <ErrorState
            compact
            error={allQuery.error}
            title="Could not load order totals"
            onRetry={() => {
              allQuery.refetch();
              unpaidQuery.refetch();
              reviewQuery.refetch();
              processingQuery.refetch();
            }}
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total orders"
          value={totalOf(allQuery)}
          hint="All recorded orders"
          icon={ShoppingBag}
          to="/admin/orders"
        />
        <MetricCard
          label="Awaiting payment"
          value={totalOf(unpaidQuery)}
          hint="Unpaid orders"
          icon={CreditCard}
          tone="amber"
          to="/admin/orders?paymentStatus=UNPAID"
        />
        <MetricCard
          label="Manual review"
          value={totalOf(reviewQuery)}
          hint="Payment reconciliation"
          icon={AlertTriangle}
          tone="amber"
          to="/admin/orders?requiresManualReview=true"
        />
        <MetricCard
          label="Being fulfilled"
          value={totalOf(processingQuery)}
          hint="Marked processing"
          icon={Truck}
          tone="blue"
          to="/admin/orders?fulfillmentStatus=PROCESSING"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.5fr_0.8fr]">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold tracking-tight">Recent orders</h2>
              <p className="mt-0.5 text-xs text-muted">Newest first, limited to six</p>
            </div>
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:underline"
            >
              View all
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-4">
            {recentQuery.isLoading ? (
              <PageLoading label="Loading orders" />
            ) : recentQuery.isError ? (
              <ErrorState
                compact
                error={recentQuery.error}
                title="Could not load recent orders"
                onRetry={() => recentQuery.refetch()}
              />
            ) : recentQuery.data?.data?.length ? (
              <OrderTable orders={recentQuery.data.data} />
            ) : (
              <div className="rounded-2xl border border-dashed border-line bg-page/60 px-5 py-10 text-center">
                <ClipboardList className="mx-auto text-muted" size={26} aria-hidden="true" />
                <p className="mt-3 font-bold">No orders yet</p>
                <p className="mt-1 text-sm text-muted">
                  Storefront checkouts will appear here after the first order is created.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-line bg-deep p-5 text-white shadow-soft">
            <Package size={22} className="text-accent" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-extrabold tracking-tight">Catalogue actions</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Create products, update pricing and stock, upload images, and manage categories.
            </p>
            <div className="mt-5 space-y-2">
              <Link
                to="/admin/products/new"
                className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-sm font-bold transition hover:bg-white/15"
              >
                Add a product
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link
                to="/admin/categories"
                className="flex items-center justify-between rounded-xl bg-white/10 px-3.5 py-3 text-sm font-bold transition hover:bg-white/15"
              >
                Manage categories
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-muted">
              API constraint
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              There is no admin endpoint that lists inactive products. This workspace can manage
              active products and products deactivated during the current browser session.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
