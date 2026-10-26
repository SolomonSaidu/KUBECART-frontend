import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useCategories, useProducts } from "./queries";
import ProductCard from "../../components/ui/ProductCard";
import { EmptyState, ErrorState, ProductGridSkeleton } from "../../components/ui/DataState";
import Pagination from "../../components/ui/Pagination";
import Button from "../../components/ui/Button";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price:asc", label: "Price: low to high" },
  { value: "price:desc", label: "Price: high to low" },
  { value: "name:asc", label: "Name: A–Z" },
];

const validSorts = new Set(sortOptions.map((option) => option.value));

export default function CatalogView({ variant = "shop" }) {
  const isNewArrivals = variant === "new";
  useDocumentTitle(isNewArrivals ? "New Arrivals" : "Shop All Products");

  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";
  const sortParam = searchParams.get("sort");
  const sort = isNewArrivals ? "newest" : validSorts.has(sortParam) ? sortParam : "newest";

  const [searchDraft, setSearchDraft] = useState(search);
  const limit = 12;

  useEffect(() => {
    setSearchDraft(search);
  }, [search]);

  const params = useMemo(
    () => ({
      page,
      limit,
      search: search || undefined,
      categorySlug: category || undefined,
      sort,
    }),
    [page, search, category, sort]
  );

  const productsQuery = useProducts(params);
  const categoriesQuery = useCategories();

  const products = productsQuery.data?.data || [];
  const pagination = productsQuery.data?.pagination || null;
  const categories = categoriesQuery.data || [];
  const activeCategory = categories.find((item) => item.slug === category);

  function updateParams(updates) {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) next.delete(key);
      else next.set(key, String(value));
    });
    if (!Object.prototype.hasOwnProperty.call(updates, "page")) next.delete("page");
    setSearchParams(next);
  }

  function handleSearch(event) {
    event.preventDefault();
    updateParams({ search: searchDraft.trim(), page: null });
  }

  function clearFilters() {
    setSearchParams({});
    setSearchDraft("");
  }

  const hasFilters = Boolean(search || category || sortParam);

  return (
    <main className="pb-14 pt-10">
      <div className="page-container">
        <section className="mb-8 grid items-center gap-7 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <span className="eyebrow">{isNewArrivals ? "Just landed" : "Shop KubeCart"}</span>
            <h1 className="mt-4 max-w-2xl text-[clamp(2.4rem,4vw,4rem)] font-extrabold leading-[1.04] tracking-[-0.06em]">
              {isNewArrivals
                ? "The latest products, fresh in store."
                : activeCategory
                  ? activeCategory.name
                  : "Products for every part of your day."}
            </h1>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              {isNewArrivals
                ? "Explore the newest additions across every category, ordered by the most recently added products."
                : activeCategory?.description ||
                  "Browse the complete active catalogue. Search by name or description, filter by category, and sort by price or recency."}
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-[#1a1f2c] to-[#313d5b] p-7 text-white shadow-soft">
            <span className="text-sm text-white/70">
              {isNewArrivals ? "New arrivals" : "Catalogue"}
            </span>
            <strong className="mt-2 block text-[clamp(2rem,3vw,3rem)] font-extrabold tracking-[-0.05em]">
              {productsQuery.isLoading ? "—" : `${pagination?.total ?? products.length} products`}
            </strong>
            <small className="mt-2 block text-sm leading-relaxed text-white/65">
              {isNewArrivals
                ? "Stock availability is shown on each product."
                : "Delivery and totals are confirmed by the server at checkout."}
            </small>
          </div>
        </section>

        {!isNewArrivals && (
          <section className="mb-7" aria-label="Product filters">
            <div className="rounded-3xl border border-line bg-white p-5 shadow-[0_15px_30px_rgba(18,24,38,0.03)] sm:p-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => updateParams({ category: null })}
                  className={
                    !category
                      ? "rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(255,107,53,0.2)]"
                      : "rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent/40"
                  }
                  aria-pressed={!category}
                >
                  All
                </button>
                {categoriesQuery.isLoading &&
                  Array.from({ length: 3 }).map((_, index) => (
                    <span key={index} className="skeleton h-10 w-24 rounded-full" aria-hidden="true" />
                  ))}
                {categories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => updateParams({ category: item.slug })}
                    className={
                      category === item.slug
                        ? "rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-[0_10px_20px_rgba(255,107,53,0.2)]"
                        : "rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-accent/40"
                    }
                    aria-pressed={category === item.slug}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center">
                <form onSubmit={handleSearch} className="flex flex-1 gap-2" role="search">
                  <label htmlFor="catalog-search" className="sr-only">
                    Search products
                  </label>
                  <div className="relative flex-1">
                    <Search
                      size={17}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                      aria-hidden="true"
                    />
                    <input
                      id="catalog-search"
                      type="search"
                      value={searchDraft}
                      onChange={(event) => setSearchDraft(event.target.value)}
                      placeholder="Search by product name or description"
                      className="field-input pl-11"
                    />
                  </div>
                  <Button type="submit" variant="dark">
                    Search
                  </Button>
                </form>

                <div className="flex items-center gap-2">
                  <label htmlFor="catalog-sort" className="text-sm font-semibold text-muted">
                    <SlidersHorizontal size={15} className="mr-1 inline" aria-hidden="true" />
                    Sort
                  </label>
                  <select
                    id="catalog-sort"
                    value={sort}
                    onChange={(event) => updateParams({ sort: event.target.value, page: null })}
                    className="field-input w-auto py-2.5"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:underline"
                >
                  <X size={14} aria-hidden="true" />
                  Clear all filters
                </button>
              )}
            </div>
          </section>
        )}

        <section aria-live="polite" aria-busy={productsQuery.isLoading}>
          {productsQuery.isLoading && <ProductGridSkeleton count={8} />}

          {productsQuery.isError && (
            <ErrorState
              error={productsQuery.error}
              title="Products could not be loaded"
              onRetry={() => productsQuery.refetch()}
            />
          )}

          {productsQuery.isSuccess && products.length === 0 && (
            <EmptyState
              title="No products found"
              description={
                hasFilters
                  ? "Try a different search term, category, or sort option."
                  : "There are no active products in the store right now."
              }
              action={
                hasFilters ? (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button as={Link} to="/">
                    Back to home
                  </Button>
                )
              }
            />
          )}

          {products.length > 0 && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
                <p>
                  Showing <span className="font-semibold text-ink">{products.length}</span> of{" "}
                  {pagination?.total ?? products.length} products
                  {search ? ` for “${search}”` : ""}
                  {activeCategory ? ` in ${activeCategory.name}` : ""}
                </p>
                <p>Only active products are shown.</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} priority={index < 4} />
                ))}
              </div>
              <Pagination
                pagination={pagination}
                onPageChange={(nextPage) => {
                  updateParams({ page: nextPage });
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mt-9"
              />
            </>
          )}
        </section>

        {!isNewArrivals && (
          <section className="mt-12">
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-line bg-gradient-to-br from-[#fff1ea] to-[#ebf3ff] p-7 sm:flex-row sm:items-center sm:p-9">
              <div>
                <span className="eyebrow-dark">Need something specific?</span>
                <h2 className="mt-3 text-[clamp(1.6rem,3vw,2.5rem)] font-extrabold tracking-[-0.05em]">
                  Search the full catalogue
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  Search matches product names and descriptions on the server.
                </p>
              </div>
              <Button as={Link} to="/search" variant="dark">
                Open search
              </Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
