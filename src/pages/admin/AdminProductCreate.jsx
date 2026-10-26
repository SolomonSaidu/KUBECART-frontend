import { ArrowLeft, CheckCircle2, PackagePlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import ProductForm from "../../components/admin/ProductForm";
import { createProduct } from "../../services/admin";
import { trackProduct } from "../../lib/adminProductTracker";

export default function AdminProductCreatePage() {
  useDocumentTitle("New Product");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (response) => {
      const product = response?.data;
      if (!product) return;
      if (product.isActive === false) trackProduct(product);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      navigate(`/admin/products/${encodeURIComponent(product.slug)}/edit`, {
        replace: true,
        state: { justCreated: true },
      });
    },
  });

  return (
    <div>
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to products
      </Link>

      <div className="mt-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/10 text-accent">
          <PackagePlus size={22} aria-hidden="true" />
        </span>
        <div>
          <span className="eyebrow-dark">Catalogue</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em]">New product</h1>
        </div>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Create the product record first. After saving, you can upload or replace images on the edit
        screen. Price is sent to the API in kobo.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-7">
        <ProductForm
          mode="create"
          onSubmit={(payload) => mutation.mutate(payload)}
          isPending={mutation.isPending}
          error={mutation.error}
        />
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-line bg-white p-4 text-xs leading-relaxed text-muted">
        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
        New products are public only when active. If you create an inactive product, it will be
        listed in this admin session only, because there is no API for browsing inactive products.
      </div>
    </div>
  );
}
