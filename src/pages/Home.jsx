import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Gem,
  Headphones,
  Home,
  Layers3,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  Sparkles,
  Truck,
  PackageCheck,
  Footprints,
} from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useCategories, useProducts } from "../features/catalog/queries";
import { ProductGridSkeleton, ErrorState, EmptyState } from "../components/ui/DataState";
import ProductCard from "../components/ui/ProductCard";
import { formatMoney, getPrimaryImage } from "../lib/format";
import ProductImage from "../components/ui/ProductImage";
import Button from "../components/ui/Button";

const iconMap = {
  shoes: Footprints,
  electronics: Headphones,
  fashion: Shirt,
  clothes: Shirt,
  home: Home,
  beauty: Sparkles,
  jewelry: Gem,
  gadgets: Headphones,
};

function CategoryCard({ category }) {
  const key = (category.slug || category.name || "").toLowerCase();
  const Icon = iconMap[key] || (key.includes("shoe") ? Footprints : Layers3);

  return (
    <Link
      to={`/products?category=${encodeURIComponent(category.slug)}`}
      className="group rounded-3xl border border-line bg-panel p-6 shadow-[0_15px_30px_rgba(18,24,38,0.03)] transition hover:-translate-y-1 hover:border-accent/30 hover:shadow-soft"
    >
      <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#fff3ee] to-[#edf4ff] text-accent">
        <Icon size={30} strokeWidth={1.6} aria-hidden="true" />
      </div>
      <h3 className="text-lg font-bold tracking-tight group-hover:text-accent">{category.name}</h3>
      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
        {category.description || "Browse products in this category."}
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-muted">
        {category._count?.products ?? 0} {category._count?.products === 1 ? "product" : "products"}
        <ArrowRight size={14} aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function HomePage() {
  useDocumentTitle("Online Shopping");
  const categories = useCategories();
  const featured = useProducts({ page: 1, limit: 4, sort: "newest" });
  const products = featured.data?.data || [];

  return (
    <main>
      <section className="pb-8 pt-10 sm:pt-12">
        <div className="page-container grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <span className="eyebrow">Everyday essentials, elevated</span>
            <h1 className="mt-5 max-w-2xl text-[clamp(2.7rem,5vw,5rem)] font-extrabold leading-[1.02] tracking-[-0.06em]">
              Smart deals for better living.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Discover quality products across fashion, gadgets, home, and everyday
              essentials — with a secure checkout and totals confirmed by the server.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button as={Link} to="/products" size="lg">
                Shop now
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
              <Button as={Link} to="/new-arrivals" variant="secondary" size="lg">
                View new arrivals
              </Button>
            </div>
            <ul className="mt-9 flex flex-wrap gap-8">
              <li className="flex flex-col gap-1">
                <strong className="text-2xl tracking-tight">Paystack</strong>
                <span className="text-xs text-muted">Secure card payment</span>
              </li>
              <li className="flex flex-col gap-1">
                <strong className="text-2xl tracking-tight">15 min</strong>
                <span className="text-xs text-muted">Stock reservation at checkout</span>
              </li>
              <li className="flex flex-col gap-1">
                <strong className="text-2xl tracking-tight">NGN</strong>
                <span className="text-xs text-muted">Prices in Nigerian naira</span>
              </li>
            </ul>
          </div>

          <div className="relative min-h-[420px] sm:min-h-[540px]">
            <div className="absolute inset-x-0 bottom-16 top-0 overflow-hidden rounded-[30px] shadow-soft sm:inset-x-8 sm:bottom-20 sm:right-0">
              <img
                src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80"
                alt="Featured smart watch from the KubeCart collection"
                width="900"
                height="900"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-6 left-6 rounded-full bg-white/80 px-4 py-2 text-sm font-bold backdrop-blur">
                Featured essentials
              </span>
            </div>
            <div className="absolute right-0 top-8 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-soft backdrop-blur">
              <span className="text-xs text-muted">Checkout</span>
              <strong className="mt-1 block text-lg tracking-tight">Secured by Paystack</strong>
            </div>
            <div className="absolute bottom-0 left-3 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-soft backdrop-blur sm:left-6">
              <span className="text-xs text-muted">Delivery</span>
              <strong className="mt-1 block text-lg tracking-tight">Nationwide in Nigeria</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10" aria-labelledby="categories-heading">
        <div className="page-container">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow-dark">Browse by category</span>
              <h2 id="categories-heading" className="mt-3 text-[clamp(2rem,3vw,3rem)] font-extrabold tracking-[-0.05em]">
                Shop what you love
              </h2>
            </div>
            <Link to="/products" className="text-sm font-bold text-accent hover:underline">
              See all products
            </Link>
          </div>

          {categories.isLoading && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-line bg-white p-6">
                  <div className="skeleton mb-5 h-16 w-16 rounded-2xl" />
                  <div className="skeleton h-5 w-2/3 rounded-full" />
                  <div className="skeleton mt-3 h-3 w-full rounded-full" />
                </div>
              ))}
            </div>
          )}

          {categories.isError && (
            <ErrorState
              error={categories.error}
              title="Categories are unavailable"
              onRetry={() => categories.refetch()}
            />
          )}

          {categories.isSuccess && categories.data.length === 0 && (
            <EmptyState
              title="Categories are being prepared"
              description="There are no categories on the server yet. Check back soon."
            />
          )}

          {categories.isSuccess && categories.data.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {categories.data.slice(0, 4).map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-10" aria-labelledby="featured-heading">
        <div className="page-container">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow-dark">Fresh in store</span>
              <h2 id="featured-heading" className="mt-3 text-[clamp(2rem,3vw,3rem)] font-extrabold tracking-[-0.05em]">
                Latest products
              </h2>
            </div>
            <Link to="/products" className="text-sm font-bold text-accent hover:underline">
              View all products
            </Link>
          </div>

          {featured.isLoading && <ProductGridSkeleton count={4} />}
          {featured.isError && (
            <ErrorState
              error={featured.error}
              title="Products could not be loaded"
              onRetry={() => featured.refetch()}
            />
          )}
          {featured.isSuccess && products.length === 0 && (
            <EmptyState
              title="No products yet"
              description="The store has no active products right now."
            />
          )}
          {products.length > 0 && (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 2} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-8">
        <div className="page-container">
          <div className="grid items-center gap-8 overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1d2231] to-[#2d415d] p-8 text-white shadow-soft sm:p-12 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex rounded-full bg-accent/20 px-3 py-2 text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#ffb69b]">
                Checkout with confidence
              </span>
              <h2 className="mt-4 text-[clamp(1.8rem,3vw,3rem)] font-extrabold leading-tight tracking-[-0.05em]">
                Clear pricing. Verified payments.
              </h2>
              <p className="mt-4 max-w-xl leading-relaxed text-white/70">
                KubeCart calculates prices, stock, delivery, and totals on the server.
                Payments are completed through Paystack and verified before an order is confirmed.
              </p>
              <Button as={Link} to="/products" size="lg" className="mt-6">
                Explore products
                <ArrowRight size={18} aria-hidden="true" />
              </Button>
            </div>
            <div className="grid gap-4">
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div>
                  <span className="text-sm text-white/60">Payments</span>
                  <strong className="mt-1 block text-lg">Server-verified with Paystack</strong>
                </div>
                <ShieldCheck className="shrink-0 text-[#ffb69b]" aria-hidden="true" />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-accent/30 to-white/10 p-5">
                <div>
                  <span className="text-sm text-white/60">Inventory</span>
                  <strong className="mt-1 block text-lg">Reserved while you pay</strong>
                </div>
                <Clock3 className="shrink-0 text-[#ffb69b]" aria-hidden="true" />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5">
                <div>
                  <span className="text-sm text-white/60">Totals</span>
                  <strong className="mt-1 block text-lg">Confirmed at checkout</strong>
                </div>
                <CheckCircle2 className="shrink-0 text-[#ffb69b]" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10" aria-label="Store advantages">
        <div className="page-container grid gap-5 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Nationwide delivery", text: "Delivery fees are calculated by the server at checkout." },
            { icon: ShieldCheck, title: "Secure checkout", text: "Payment is completed on Paystack — card details never touch KubeCart." },
            { icon: PackageCheck, title: "Order tracking", text: "Use your order reference to check payment and fulfilment status." },
          ].map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-3xl border border-line bg-panel p-7 text-center shadow-[0_15px_30px_rgba(18,24,38,0.03)]"
            >
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#fff2ed] to-[#eef5ff] text-accent">
                <Icon size={28} strokeWidth={1.7} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
