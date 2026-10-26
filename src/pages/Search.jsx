import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useProducts } from "../features/catalog/queries";
import { EmptyState, ErrorState, ProductGridSkeleton } from "../components/ui/DataState";
import Pagination from "../components/ui/Pagination";
import ProductImage from "../components/ui/ProductImage";
import Button from "../components/ui/Button";
import { formatMoney, getPrimaryImage } from "../lib/format";
import { useCartStore } from "../store/cartStore";

function SearchResult({ product }) {
  const addItem = useCartStore((state) => state.addItem);
  const image = getPrimaryImage(product.images);
  const outOfStock = Number(product.stock) <= 0;

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-line bg-white p-4 sm:flex-row sm:items-center">
      <Link to={`/products/${product.slug}`} className="shrink-0">
        <ProductImage
          src={image?.url}
          alt={product.name}
          className="h-40 w-full rounded-2xl sm:h-24 sm:w-24"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{product.category?.name || "Product"}</p>
        <h2 className="mt-1 text-lg font-bold leading-snug tracking-tight">
          <Link to={`/products/${product.slug}`} className="hover:text-accent">
            {product.name}
          </Link>
        </h2>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <strong className="text-lg">{formatMoney(product.priceKobo)}</strong>
            <span className="ml-2 text-xs text-muted">
              {outOfStock ? "Out of stock" : `${product.stock} in stock`}
            </span>
          </div>
          <Button
            size="sm"
            disabled={outOfStock}
            onClick={() =>
              addItem({
                id: product.id,
                slug: product.slug,
                name: product.name,
                priceKobo: product.priceKobo,
                stock: product.stock,
                imageUrl: image?.url,
              })
            }
          >
            <ShoppingBag size={15} aria-hidden="true" />
            Add to cart
          </Button>
        </div>
      </div>
    </article>
  );
}

export default function SearchPage() {
  useDocumentTitle("Search Products");
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const [draft, setDraft] = useState(q);

  const params = { page, limit: 12, search: q || undefined };
  const results = useProducts(params, { enabled: Boolean(q) });
  const products = results.data?.data || [];

  function submit(event) {
    event.preventDefault();
    const next = new URLSearchParams();
    const query = draft.trim();
    if (query) next.set("q", query);
    setSearchParams(next);
  }

  return (
    <main className="py-12">
      <div className="page-container">
        <section className="rounded-3xl border border-line bg-panel p-6 shadow-soft sm:p-9">
          <span className="eyebrow">Find available products</span>
          <h1 className="mt-4 text-[clamp(2.2rem,4vw,3.5rem)] font-extrabold tracking-[-0.06em]">
            Search our catalogue
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            Search matches active product names and descriptions. Use the category filters on the
            shop page to browse by category.
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-3 sm:flex-row" role="search">
            <label htmlFor="search-page-input" className="sr-only">
              Search products
            </label>
            <div className="relative flex-1">
              <Search
                size={19}
                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                id="search-page-input"
                type="search"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Search by product name or description"
                className="field-input rounded-2xl py-4 pl-12 text-base"
                autoFocus
              />
            </div>
            <Button type="submit" size="lg" className="rounded-2xl">
              Search
            </Button>
          </form>

          {!q && (
            <div className="mt-7 rounded-2xl border border-dashed border-ink/15 bg-page/70 px-5 py-8 text-center text-sm text-muted">
              Type a product name or description to find available items.
            </div>
          )}

          {q && (
            <div className="mt-8" aria-live="polite" aria-busy={results.isLoading}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  Results for “{q}”
                </h2>
                {results.isSuccess && (
                  <p className="text-sm text-muted">
                    {results.data?.pagination?.total ?? 0} matching{" "}
                    {results.data?.pagination?.total === 1 ? "product" : "products"}
                  </p>
                )}
              </div>

              {results.isLoading && <ProductGridSkeleton count={4} />}
              {results.isError && (
                <ErrorState
                  error={results.error}
                  title="Search could not be completed"
                  onRetry={() => results.refetch()}
                />
              )}
              {results.isSuccess && products.length === 0 && (
                <EmptyState
                  title="No matching products"
                  description="Try a different product name or a broader search term."
                  action={
                    <Button as={Link} to="/products" variant="secondary">
                      Browse all products
                    </Button>
                  }
                />
              )}
              {products.length > 0 && (
                <>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {products.map((product) => (
                      <SearchResult key={product.id} product={product} />
                    ))}
                  </div>
                  <Pagination
                    pagination={results.data?.pagination}
                    onPageChange={(nextPage) => {
                      const next = new URLSearchParams(searchParams);
                      next.set("page", String(nextPage));
                      setSearchParams(next);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="mt-8"
                  />
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
