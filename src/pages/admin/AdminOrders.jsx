import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FilterX, Search, ShoppingBag } from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAdminOrders } from "../../features/admin/queries";
import OrderTable from "../../components/admin/OrderTable";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import { EmptyState, ErrorState } from "../../components/ui/DataState";
import { PageLoading } from "../../components/ui/Spinner";

const statusOptions = ["PENDING", "CONFIRMED", "CANCELLED"];
const paymentOptions = ["UNPAID", "PAID", "REFUNDED"];
const fulfillmentOptions = ["UNFULFILLED", "PROCESSING", "FULFILLED", "CANCELLED"];
const sortOptions = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "total:desc", label: "Total high to low" },
  { value: "total:asc", label: "Total low to high" },
];

export default function AdminOrdersPage() {
  useDocumentTitle("Admin Orders");
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const status = searchParams.get("status") || "";
  const paymentStatus = searchParams.get("paymentStatus") || "";
  const fulfillmentStatus = searchParams.get("fulfillmentStatus") || "";
  const requiresManualReview = searchParams.get("requiresManualReview") || "";
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const params = {
    page,
    limit: 20,
    sort,
    ...(status ? { status } : {}),
    ...(paymentStatus ? { paymentStatus } : {}),
    ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
    ...(requiresManualReview ? { requiresManualReview } : {}),
    ...(search ? { search } : {}),
  };

  const ordersQuery = useAdminOrders(params);
  const orders = ordersQuery.data?.data || [];
  const pagination = ordersQuery.data?.pagination;
  const activeFilterCount = [
    status,
    paymentStatus,
    fulfillmentStatus,
    requiresManualReview,
    search,
  ].filter(Boolean).length;

  function patchParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === "" || value === null || value === undefined) next.delete(key);
      else next.set(key, value);
    });
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next);
  }

  function submitSearch(event) {
    event.preventDefault();
    patchParams({ search: searchInput.trim() });
  }

  function clearFilters() {
    setSearchInput("");
    setSearchParams({});
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow-dark">Order management</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Orders</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Search by order reference or customer email. Filter by order, payment, and fulfilment
            state. Order rows come directly from the admin API.
          </p>
        </div>
        {pagination && (
          <div className="rounded-2xl border border-line bg-white px-4 py-3 text-right shadow-soft">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Matching orders</p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight">{pagination.total}</p>
          </div>
        )}
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-soft">
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <label htmlFor="admin-order-search" className="sr-only">
              Search orders
            </label>
            <input
              id="admin-order-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search reference or email"
              className="field-input pl-10"
              maxLength={255}
            />
          </div>
          <Button type="submit" className="sm:w-auto">
            Search
          </Button>
        </form>

        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">Order status</span>
            <select
              value={status}
              onChange={(event) => patchParams({ status: event.target.value })}
              className="field-input py-2.5"
            >
              <option value="">All</option>
              {statusOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">Payment</span>
            <select
              value={paymentStatus}
              onChange={(event) => patchParams({ paymentStatus: event.target.value })}
              className="field-input py-2.5"
            >
              <option value="">All</option>
              {paymentOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">Fulfillment</span>
            <select
              value={fulfillmentStatus}
              onChange={(event) => patchParams({ fulfillmentStatus: event.target.value })}
              className="field-input py-2.5"
            >
              <option value="">All</option>
              {fulfillmentOptions.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">Manual review</span>
            <select
              value={requiresManualReview}
              onChange={(event) => patchParams({ requiresManualReview: event.target.value })}
              className="field-input py-2.5"
            >
              <option value="">All</option>
              <option value="true">Review required</option>
              <option value="false">No review</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-muted">Sort</span>
            <select
              value={sort}
              onChange={(event) => patchParams({ sort: event.target.value })}
              className="field-input py-2.5"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {activeFilterCount > 0 && (
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3">
            <p className="text-xs text-muted">
              {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted transition hover:text-ink"
            >
              <FilterX size={14} aria-hidden="true" />
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className="mt-5">
        {ordersQuery.isLoading ? (
          <div className="rounded-2xl border border-line bg-white">
            <PageLoading label="Loading orders" />
          </div>
        ) : ordersQuery.isError ? (
          <ErrorState
            error={ordersQuery.error}
            title="Could not load orders"
            onRetry={() => ordersQuery.refetch()}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={activeFilterCount ? "No orders match these filters" : "No orders yet"}
            description={
              activeFilterCount
                ? "Try clearing one or more filters, or search for a different order reference."
                : "New storefront checkouts will appear here."
            }
            action={
              activeFilterCount ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className={ordersQuery.isFetching ? "opacity-60 transition-opacity" : ""}>
            <OrderTable orders={orders} />
          </div>
        )}

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={(nextPage) => patchParams({ page: String(nextPage) })}
            className="mt-5"
          />
        )}
      </section>
    </div>
  );
}
