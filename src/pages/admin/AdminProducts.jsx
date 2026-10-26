import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Eye,
  EyeOff,
  FilterX,
  Package,
  PackagePlus,
  Pencil,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useCategories, useProducts } from "../../features/catalog/queries";
import { getTrackedProducts, trackProduct, untrackProduct } from "../../lib/adminProductTracker";
import { getPrimaryImage, formatMoney } from "../../lib/format";
import { activateProduct, deactivateProduct } from "../../services/admin";
import ProductImage from "../../components/ui/ProductImage";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import { EmptyState, ErrorState } from "../../components/ui/DataState";
import { PageLoading } from "../../components/ui/Spinner";

function ProductCard({ product, inactive = false, onDeactivate, onActivate, pendingId }) {
  const image = getPrimaryImage(product.images);
  const pending = pendingId === product.id;
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
      <div className="relative">
        <ProductImage src={image?.url} alt={product.name} className="aspect-[4/3] w-full" />
        <div className="absolute left-2.5 top-2.5">
          <Badge tone={inactive ? "amber" : "green"}>{inactive ? "Inactive" : "Active"}</Badge>
        </div>
        {product.stock === 0 && (
          <div className="absolute right-2.5 top-2.5">
            <Badge tone="red">Out of stock</Badge>
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-[0.7rem] font-bold uppercase tracking-wide text-muted">
          {product.category?.name || "Uncategorised"}
        </p>
        <h3 className="mt-1 line-clamp-2 font-extrabold leading-snug tracking-tight">
          {product.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-muted">/{product.slug}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <strong className="text-lg tracking-tight">
            {formatMoney(product.priceKobo, { decimals: 2 })}
          </strong>
          <span className="text-xs font-semibold text-muted">Stock {product.stock}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            as={Link}
            to={`/admin/products/${encodeURIComponent(product.slug)}/edit`}
            variant="secondary"
            size="sm"
            className="flex-1"
          >
            <Pencil size={14} aria-hidden="true" />
            Edit
          </Button>
          {inactive ? (
            <Button
              size="sm"
              onClick={() => onActivate(product)}
              loading={pending}
              disabled={pending}
            >
              <Eye size={14} aria-hidden="true" />
              Activate
            </Button>
          ) : (
            <Button
              variant="outlineDanger"
              size="sm"
              onClick={() => onDeactivate(product)}
              loading={pending}
              disabled={pending}
            >
              <EyeOff size={14} aria-hidden="true" />
              Deactivate
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function AdminProductsPage() {
  useDocumentTitle("Admin Products");
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tracked, setTracked] = useState(getTrackedProducts);
  const [success, setSuccess] = useState("");

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data || [];

  const params = {
    page,
    limit: 12,
    sort: "newest",
    ...(search ? { search } : {}),
    ...(categoryId ? { categoryId } : {}),
  };
  const productsQuery = useProducts(params);
  const products = productsQuery.data?.data || [];
  const pagination = productsQuery.data?.pagination;

  useEffect(() => {
    setTracked(getTrackedProducts());
  }, []);

  const deactivateMutation = useMutation({
    mutationFn: (product) => deactivateProduct(product.id),
    onSuccess: (response, product) => {
      const raw = response?.data || {};
      trackProduct({
        ...product,
        ...raw,
        isActive: false,
        images: raw.images ?? product.images ?? [],
        category: raw.category ?? product.category,
      });
      setTracked(getTrackedProducts());
      setSuccess(`${product.name} was deactivated and hidden from the storefront.`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (product) => activateProduct(product.id),
    onSuccess: (response, product) => {
      untrackProduct(product.id);
      setTracked(getTrackedProducts());
      setSuccess(`${response?.data?.name || product.name} is active in the public catalogue again.`);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const pendingId =
    deactivateMutation.isPending
      ? deactivateMutation.variables?.id
      : activateMutation.isPending
        ? activateMutation.variables?.id
        : null;
  const actionError = deactivateMutation.error || activateMutation.error;

  const needle = search.trim().toLowerCase();
  const localInactive = tracked
    .filter((product) => product.isActive === false)
    .filter((product) => (needle ? product.name.toLowerCase().includes(needle) : true))
    .filter((product) => (categoryId ? product.categoryId === categoryId : true));

  function submitSearch(event) {
    event.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setSearchInput("");
    setCategoryId("");
    setPage(1);
  }

  const hasFilters = Boolean(search || categoryId);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow-dark">Catalogue</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">Products</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Active products come from the public product API. This workspace also tracks products
            deactivated during the current browser session because no admin product list exists.
          </p>
        </div>
        <Button as={Link} to="/admin/products/new">
          <PackagePlus size={17} aria-hidden="true" />
          New product
        </Button>
      </div>

      {success && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{success}</span>
          <button type="button" onClick={() => setSuccess("")} aria-label="Dismiss message">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      {actionError && (
        <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">Availability update failed</p>
              <p className="mt-1">{actionError.message}</p>
              <p className="mt-1 text-xs">
                Product writes require the current admin session. Sign in again if your token
                expired.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-soft">
        <form onSubmit={submitSearch} className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <label htmlFor="admin-product-search" className="sr-only">
              Search products
            </label>
            <input
              id="admin-product-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search active products by name or description"
              className="field-input pl-10"
              maxLength={255}
            />
          </div>
          <label htmlFor="admin-product-category" className="sr-only">
            Filter by category
          </label>
          <select
            id="admin-product-category"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setPage(1);
            }}
            className="field-input sm:w-56"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <Button type="submit">Search</Button>
          {hasFilters && (
            <Button type="button" variant="secondary" onClick={clearFilters}>
              <FilterX size={15} aria-hidden="true" />
              Clear
            </Button>
          )}
        </form>
        <p className="mt-2 text-xs text-muted">
          Search and category filters apply to active products from the API and to locally tracked
          inactive products.
        </p>
      </section>

      {localInactive.length > 0 && (
        <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Archive size={18} className="text-amber-700" aria-hidden="true" />
              <h2 className="text-lg font-extrabold tracking-tight">Inactive in this session</h2>
              <Badge tone="amber">{localInactive.length}</Badge>
            </div>
            <p className="text-xs text-amber-900/80">
              Local tracking only · not a complete inactive-product list
            </p>
          </div>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-amber-900/80">
            These products were deactivated here (or created inactive) during this browser session.
            They disappear on tab close because the backend has no admin product list endpoint.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {localInactive.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                inactive
                onActivate={(item) => {
                  setSuccess("");
                  activateMutation.mutate(item);
                }}
                onDeactivate={() => {}}
                pendingId={pendingId}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">Active catalogue</h2>
            <p className="mt-0.5 text-xs text-muted">
              {pagination ? `${pagination.total} active products` : "Loading active products"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => productsQuery.refetch()}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink"
          >
            <RefreshCw
              size={14}
              className={productsQuery.isFetching ? "animate-spin" : ""}
              aria-hidden="true"
            />
            Refresh images & stock
          </button>
        </div>

        <div className="mt-4">
          {productsQuery.isLoading ? (
            <div className="rounded-2xl border border-line bg-white">
              <PageLoading label="Loading products" />
            </div>
          ) : productsQuery.isError ? (
            <ErrorState
              error={productsQuery.error}
              title="Could not load products"
              onRetry={() => productsQuery.refetch()}
            />
          ) : products.length === 0 ? (
            <EmptyState
              icon={Package}
              title={hasFilters ? "No active products match" : "No active products"}
              description={
                hasFilters
                  ? "Adjust or clear the filters. Inactive products are only available when tracked in this session."
                  : "Create the first product to populate the storefront."
              }
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button as={Link} to="/admin/products/new">
                    <PackagePlus size={16} aria-hidden="true" />
                    New product
                  </Button>
                )
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onDeactivate={(item) => {
                    setSuccess("");
                    deactivateMutation.mutate(item);
                  }}
                  onActivate={(item) => {
                    setSuccess("");
                    activateMutation.mutate(item);
                  }}
                  pendingId={pendingId}
                />
              ))}
            </div>
          )}
        </div>

        {pagination && (
          <Pagination
            pagination={pagination}
            onPageChange={(nextPage) => setPage(nextPage)}
            className="mt-5"
          />
        )}
      </section>

      <div className="mt-6 rounded-2xl border border-line bg-white p-4 text-xs leading-relaxed text-muted">
        Inactive products from other sessions cannot be discovered or restored through the API.
        Image URLs from the private bucket expire after about one hour; refresh this page to request
        fresh signed URLs. Stock changes made outside this admin session can surface as checkout
        conflicts.
      </div>
    </div>
  );
}
