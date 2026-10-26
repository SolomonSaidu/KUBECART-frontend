import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Package,
  RefreshCw,
  X,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useProduct } from "../../features/catalog/queries";
import { queryKeys } from "../../lib/queryKeys";
import { findTrackedProduct, trackProduct, untrackProduct } from "../../lib/adminProductTracker";
import { activateProduct, deactivateProduct, updateProduct } from "../../services/admin";
import ProductForm from "../../components/admin/ProductForm";
import ImageManager from "../../components/admin/ImageManager";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/DataState";
import { PageLoading } from "../../components/ui/Spinner";

export default function AdminProductEditPage() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tracked, setTracked] = useState(() => findTrackedProduct(slug));
  const [success, setSuccess] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const productQuery = useProduct(slug);
  const product = tracked || productQuery.data;

  useDocumentTitle(product?.name ? `Edit ${product.name}` : "Edit Product");

  useEffect(() => {
    setTracked(findTrackedProduct(slug));
  }, [slug]);

  function refreshRelated(nextSlug, oldSlug) {
    queryClient.invalidateQueries({ queryKey: queryKeys.product(nextSlug) });
    queryClient.invalidateQueries({ queryKey: queryKeys.product(oldSlug) });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  const updateMutation = useMutation({
    mutationFn: (payload) => updateProduct(product.id, payload),
    onSuccess: (response) => {
      const raw = response?.data;
      if (!raw) return;
      const merged = {
        ...product,
        ...raw,
        images: raw.images ?? product.images ?? [],
        category: raw.category ?? product.category,
      };
      if (merged.isActive === false) {
        trackProduct(merged);
        setTracked(merged);
      } else {
        untrackProduct(merged.id);
        setTracked(null);
      }
      setSuccess(response.message || "Product updated.");
      refreshRelated(merged.slug, slug);
      if (merged.slug && merged.slug !== slug) {
        navigate(`/admin/products/${encodeURIComponent(merged.slug)}/edit`, { replace: true });
      }
    },
  });

  const availabilityMutation = useMutation({
    mutationFn: (status) =>
      status === "deactivate" ? deactivateProduct(product.id) : activateProduct(product.id),
    onSuccess: (response, status) => {
      const raw = response?.data || {};
      if (status === "deactivate") {
        const merged = {
          ...product,
          ...raw,
          isActive: false,
          images: raw.images ?? product.images ?? [],
          category: raw.category ?? product.category,
        };
        trackProduct(merged);
        setTracked(merged);
        setSuccess(
          "Product deactivated. It is hidden from the public catalogue and listed in this admin session."
        );
        queryClient.removeQueries({ queryKey: queryKeys.product(slug) });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
      } else {
        untrackProduct(product.id);
        setTracked(null);
        setSuccess("Product reactivated and visible in the public catalogue.");
        refreshRelated(raw.slug || slug, slug);
      }
      setConfirmDeactivate(false);
    },
  });

  function handleImagesChange(images) {
    if (product.isActive === false) {
      const merged = { ...product, images };
      trackProduct(merged);
      setTracked(merged);
    }
  }

  if (!product && productQuery.isLoading) {
    return (
      <div className="rounded-2xl border border-line bg-white">
        <PageLoading label="Loading product" />
      </div>
    );
  }

  if (!product) {
    if (productQuery.isError && productQuery.error?.status !== 404) {
      return (
        <div>
          <Link
            to="/admin/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to products
          </Link>
          <div className="mt-5">
            <ErrorState
              error={productQuery.error}
              title="Could not load this product"
              onRetry={() => productQuery.refetch()}
            />
          </div>
        </div>
      );
    }

    return (
      <div>
        <Link
          to="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to products
        </Link>
        <div className="mt-6 rounded-2xl border border-line bg-white p-8 text-center shadow-soft">
          <Package size={30} className="mx-auto text-muted" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Product unavailable</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">
            The public API only returns active products, and this product is not tracked as inactive
            in the current browser session. There is no admin product-detail endpoint, so it cannot
            be opened here.
          </p>
          <Button as={Link} to="/admin/products" className="mt-5">
            Return to products
          </Button>
        </div>
      </div>
    );
  }

  const isActive = product.isActive !== false;
  const availabilityError = availabilityMutation.error;

  return (
    <div>
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to products
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isActive ? "green" : "amber"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
            <span className="text-xs text-muted">/{product.slug}</span>
          </div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {product.category?.name || "Uncategorised"} · Stock {product.stock}
          </p>
        </div>
        {isActive && (
          <Button as={Link} to={`/products/${encodeURIComponent(product.slug)}`} variant="secondary" size="sm">
            <Eye size={15} aria-hidden="true" />
            View in store
          </Button>
        )}
      </div>

      {(success || location.state?.justCreated) && (
        <div
          role="status"
          className="mt-5 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
        >
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {success || "Product created. You can upload an image below or continue editing."}
          </span>
          <button
            type="button"
            onClick={() => {
              setSuccess("");
              navigate(location.pathname, { replace: true, state: null });
            }}
            aria-label="Dismiss message"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-6">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-accent" aria-hidden="true" />
            <h2 className="text-lg font-extrabold tracking-tight">Product details</h2>
          </div>
          <div className="mt-5">
            <ProductForm
              mode="edit"
              product={product}
              onSubmit={(payload) => {
                setSuccess("");
                updateMutation.mutate(payload);
              }}
              isPending={updateMutation.isPending}
              error={updateMutation.error}
              cancelTo="/admin/products"
            />
          </div>
        </section>

        <div className="space-y-5 xl:sticky xl:top-24">
          <ImageManager product={product} onImagesChange={handleImagesChange} />

          <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
            <h2 className="text-lg font-extrabold tracking-tight">Availability</h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Deactivation hides the product from public catalogue endpoints without deleting it or
              affecting existing orders.
            </p>

            {availabilityError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                <p className="font-bold">Availability update failed</p>
                <p className="mt-1">{availabilityError.message}</p>
              </div>
            )}

            {isActive && !confirmDeactivate && (
              <Button
                variant="outlineDanger"
                className="mt-4 w-full"
                onClick={() => {
                  availabilityMutation.reset();
                  setConfirmDeactivate(true);
                }}
              >
                <EyeOff size={16} aria-hidden="true" />
                Deactivate product
              </Button>
            )}

            {isActive && confirmDeactivate && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5">
                <p className="flex items-start gap-2 text-xs font-semibold text-red-900">
                  <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
                  This product will disappear from the storefront and public product queries.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1"
                    onClick={() => availabilityMutation.mutate("deactivate")}
                    loading={availabilityMutation.isPending}
                  >
                    Deactivate
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setConfirmDeactivate(false)}>
                    Keep active
                  </Button>
                </div>
              </div>
            )}

            {!isActive && (
              <Button
                className="mt-4 w-full"
                onClick={() => {
                  availabilityMutation.reset();
                  availabilityMutation.mutate("activate");
                }}
                loading={availabilityMutation.isPending}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Reactivate product
              </Button>
            )}

            {!isActive && (
              <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-xs leading-relaxed text-amber-900">
                This inactive product is visible only through this browser session. Refreshing the
                page keeps it; closing the tab loses the local tracking record.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-line bg-white p-5 text-xs leading-relaxed text-muted shadow-soft">
            <p>
              Product ID <span className="break-all font-mono">{product.id}</span>
            </p>
            <p className="mt-2">
              Last updated {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : "—"}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
