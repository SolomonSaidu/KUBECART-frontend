import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock3,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { useProduct, useProducts } from "../features/catalog/queries";
import ProductImage from "../components/ui/ProductImage";
import QuantityStepper from "../components/ui/QuantityStepper";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import ProductCard from "../components/ui/ProductCard";
import { EmptyState, ErrorState } from "../components/ui/DataState";
import { formatMoney, getPrimaryImage } from "../lib/format";
import { useCartStore } from "../store/cartStore";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const productQuery = useProduct(slug);
  const product = productQuery.data;
  useDocumentTitle(product?.name || "Product");

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const related = useProducts(
    {
      page: 1,
      limit: 4,
      categorySlug: product?.category?.slug,
    },
    { enabled: Boolean(product?.category?.slug) }
  );

  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setAdded(false);
  }, [slug]);

  if (productQuery.isLoading) {
    return (
      <main className="page-container py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="skeleton aspect-square rounded-[30px]" />
          <div className="space-y-5 py-4">
            <div className="skeleton h-4 w-28 rounded-full" />
            <div className="skeleton h-12 w-4/5 rounded-2xl" />
            <div className="skeleton h-8 w-36 rounded-full" />
            <div className="skeleton h-24 w-full rounded-2xl" />
            <div className="skeleton h-12 w-52 rounded-full" />
          </div>
        </div>
      </main>
    );
  }

  if (productQuery.isError) {
    const notFound = productQuery.error?.status === 404;
    return (
      <main className="page-container py-16">
        {notFound ? (
          <EmptyState
            title="Product not found"
            description="This product may no longer be active or the link may be incorrect."
            action={
              <Button as={Link} to="/products">
                Browse products
              </Button>
            }
          />
        ) : (
          <ErrorState
            error={productQuery.error}
            title="Product could not be loaded"
            onRetry={() => productQuery.refetch()}
          />
        )}
      </main>
    );
  }

  if (!product) return null;

  const images = product.images || [];
  const selectedImage = images[activeImage] || getPrimaryImage(images);
  const outOfStock = Number(product.stock) <= 0;
  const lowStock = !outOfStock && Number(product.stock) <= 5;

  function handleAdd(goToCheckout = false) {
    addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        priceKobo: product.priceKobo,
        stock: product.stock,
        imageUrl: selectedImage?.url,
      },
      quantity
    );
    if (goToCheckout) {
      navigate("/checkout");
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  const relatedProducts = (related.data?.data || []).filter((item) => item.id !== product.id);

  return (
    <main className="pb-14 pt-8">
      <div className="page-container">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-muted">
          <Link to="/" className="hover:text-accent">Home</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link to="/products" className="hover:text-accent">Products</Link>
          {product.category && (
            <>
              <ChevronRight size={14} aria-hidden="true" />
              <Link
                to={`/products?category=${encodeURIComponent(product.category.slug)}`}
                className="hover:text-accent"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <ChevronRight size={14} aria-hidden="true" />
          <span className="truncate font-medium text-ink">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <section aria-label="Product images">
            <ProductImage
              src={selectedImage?.url}
              alt={product.name}
              priority
              showFallbackLabel
              className="aspect-square w-full rounded-[30px] shadow-soft"
            />
            {images.length > 1 && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={
                      activeImage === index
                        ? "rounded-2xl border-2 border-accent p-1"
                        : "rounded-2xl border-2 border-transparent p-1 hover:border-line"
                    }
                    aria-label={`View image ${index + 1} of ${images.length}`}
                    aria-pressed={activeImage === index}
                  >
                    <ProductImage
                      src={image.url}
                      alt=""
                      className="aspect-square w-full rounded-xl"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <span className="eyebrow">{product.category?.name || "KubeCart"}</span>
              {outOfStock ? (
                <Badge tone="red">Out of stock</Badge>
              ) : lowStock ? (
                <Badge tone="amber">Only {product.stock} left</Badge>
              ) : (
                <Badge tone="green">In stock</Badge>
              )}
            </div>

            <h1 className="mt-5 text-[clamp(2.2rem,4vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.06em]">
              {product.name}
            </h1>
            <p className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
              {formatMoney(product.priceKobo)}
            </p>
            <p className="mt-1.5 text-sm text-muted">
              Price in {product.currency || "NGN"}. Delivery and final totals are confirmed by the
              server at checkout.
            </p>

            <p className="mt-6 whitespace-pre-line leading-relaxed text-muted">
              {product.description}
            </p>

            <div className="mt-7 rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                    Quantity
                  </span>
                  <div className="mt-2">
                    <QuantityStepper
                      value={quantity}
                      max={product.stock}
                      disabled={outOfStock}
                      onChange={setQuantity}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-semibold uppercase tracking-wide text-muted">
                    Estimated subtotal
                  </span>
                  <strong className="mt-2 block text-xl">
                    {formatMoney(product.priceKobo * quantity)}
                  </strong>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Button
                  size="lg"
                  onClick={() => handleAdd(false)}
                  disabled={outOfStock}
                >
                  {added ? <Check size={18} aria-hidden="true" /> : <ShoppingBag size={18} aria-hidden="true" />}
                  {added ? "Added to cart" : "Add to cart"}
                </Button>
                <Button
                  size="lg"
                  variant="dark"
                  onClick={() => handleAdd(true)}
                  disabled={outOfStock}
                >
                  Buy now
                </Button>
              </div>
              <p className="mt-3 text-center text-xs text-muted">
                The server verifies stock, prices, and delivery before your order is created.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-white p-4">
                <ShieldCheck size={20} className="text-accent" aria-hidden="true" />
                <strong className="mt-2 block text-sm">Paystack secure</strong>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  Card details stay with Paystack.
                </span>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4">
                <Clock3 size={20} className="text-accent" aria-hidden="true" />
                <strong className="mt-2 block text-sm">Stock reserved</strong>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  Reservation starts at checkout.
                </span>
              </div>
              <div className="rounded-2xl border border-line bg-white p-4">
                <Truck size={20} className="text-accent" aria-hidden="true" />
                <strong className="mt-2 block text-sm">Server totals</strong>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  Delivery is calculated by the backend.
                </span>
              </div>
            </div>

            <Link
              to="/products"
              className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-muted hover:text-accent"
            >
              <ArrowLeft size={15} aria-hidden="true" />
              Back to all products
            </Link>
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16" aria-labelledby="related-heading">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <span className="eyebrow-dark">More from {product.category?.name || "this category"}</span>
                <h2 id="related-heading" className="mt-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                  You may also like
                </h2>
              </div>
              <Link
                to={`/products?category=${encodeURIComponent(product.category?.slug || "")}`}
                className="hidden text-sm font-bold text-accent hover:underline sm:block"
              >
                View category
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.slice(0, 4).map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}

        <div className="mt-10 flex items-center gap-2 rounded-2xl border border-line bg-white p-4 text-sm text-muted">
          <PackageCheck size={18} className="shrink-0 text-accent" aria-hidden="true" />
          <span>
            Need help with an order? Visit the{" "}
            <Link to="/contact" className="font-bold text-accent hover:underline">
              contact page
            </Link>{" "}
            and keep your order reference ready.
          </span>
        </div>
      </div>
    </main>
  );
}
