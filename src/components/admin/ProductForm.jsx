import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, ImagePlus, Save, Wand2 } from "lucide-react";
import { productSchema } from "../../lib/schemas";
import { slugify } from "../../lib/format";
import { useCategories } from "../../features/catalog/queries";
import Button from "../ui/Button";

export default function ProductForm({
  mode,
  product,
  onSubmit,
  isPending = false,
  error,
  cancelTo = "/admin/products",
  onCancel,
}) {
  const isEdit = mode === "edit";
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data || [];
  const [autoSlug, setAutoSlug] = useState(!isEdit);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      categoryId: product?.categoryId || "",
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      priceNaira: product ? product.priceKobo / 100 : "",
      stock: product?.stock ?? 0,
      isActive: product?.isActive ?? true,
      imageUrl: "",
    },
  });

  useEffect(() => {
    reset({
      categoryId: product?.categoryId || "",
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      priceNaira: product ? product.priceKobo / 100 : "",
      stock: product?.stock ?? 0,
      isActive: product?.isActive ?? true,
      imageUrl: "",
    });
    setAutoSlug(!isEdit);
  }, [product?.id, isEdit, reset]);

  function submit(values) {
    const payload = {
      categoryId: values.categoryId,
      name: values.name.trim(),
      slug: values.slug.trim(),
      description: values.description.trim(),
      priceKobo: Math.round(Number(values.priceNaira) * 100),
      currency: "NGN",
      stock: Number(values.stock),
      isActive: Boolean(values.isActive),
    };
    if (!isEdit && values.imageUrl?.trim()) {
      payload.images = [{ url: values.imageUrl.trim(), sortOrder: 0, isPrimary: true }];
    }
    if (isEdit) delete payload.isActive;
    onSubmit(payload);
  }

  const categoriesUnavailable = !categoriesQuery.isLoading && categories.length === 0;

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      {categoriesQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          Categories could not be loaded. Reload before choosing a category.
        </div>
      )}
      {categoriesUnavailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          No categories exist yet.{" "}
          <Link to="/admin/categories" className="font-bold underline">
            Create a category
          </Link>{" "}
          before adding a product.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="product-name" className="field-label">
            Product name
          </label>
          <input
            id="product-name"
            className="field-input"
            maxLength={255}
            placeholder="e.g. Pro Laptop"
            aria-invalid={Boolean(errors.name)}
            {...register("name", {
              onChange: (event) => {
                if (autoSlug) {
                  setValue("slug", slugify(event.target.value), { shouldValidate: false });
                }
              },
            })}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="product-slug" className="field-label">
              Slug
            </label>
            <button
              type="button"
              onClick={() => {
                setAutoSlug(true);
                setValue("slug", slugify(document.getElementById("product-name")?.value || ""));
              }}
              className="mb-2 inline-flex items-center gap-1 text-[0.7rem] font-bold text-accent hover:underline"
            >
              <Wand2 size={12} aria-hidden="true" />
              Generate
            </button>
          </div>
          <input
            id="product-slug"
            className="field-input font-mono text-sm"
            maxLength={255}
            placeholder="pro-laptop"
            aria-invalid={Boolean(errors.slug)}
            {...register("slug", { onChange: () => setAutoSlug(false) })}
          />
          {errors.slug && <p className="field-error">{errors.slug.message}</p>}
        </div>

        <div>
          <label htmlFor="product-category" className="field-label">
            Category
          </label>
          <select
            id="product-category"
            className="field-input"
            disabled={categoriesQuery.isLoading}
            aria-invalid={Boolean(errors.categoryId)}
            {...register("categoryId")}
          >
            <option value="">{categoriesQuery.isLoading ? "Loading…" : "Choose a category"}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="field-error">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label htmlFor="product-price" className="field-label">
            Price (NGN)
          </label>
          <input
            id="product-price"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            className="field-input"
            placeholder="5000.00"
            aria-invalid={Boolean(errors.priceNaira)}
            {...register("priceNaira")}
          />
          {errors.priceNaira && <p className="field-error">{errors.priceNaira.message}</p>}
          <p className="mt-1 text-xs text-muted">Converted to kobo when saved.</p>
        </div>

        <div>
          <label htmlFor="product-stock" className="field-label">
            Stock
          </label>
          <input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className="field-input"
            aria-invalid={Boolean(errors.stock)}
            {...register("stock")}
          />
          {errors.stock && <p className="field-error">{errors.stock.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="product-description" className="field-label">
            Description
          </label>
          <textarea
            id="product-description"
            rows={5}
            className="field-input resize-y"
            placeholder="Describe the product, materials, sizing, and key details."
            aria-invalid={Boolean(errors.description)}
            {...register("description")}
          />
          {errors.description && <p className="field-error">{errors.description.message}</p>}
        </div>

        {!isEdit && (
          <>
            <div className="sm:col-span-2">
              <label htmlFor="product-image-url" className="field-label">
                Image URL <span className="font-normal text-muted">(optional)</span>
              </label>
              <div className="relative">
                <ImagePlus
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  aria-hidden="true"
                />
                <input
                  id="product-image-url"
                  className="field-input pl-10"
                  placeholder="https://example.com/product.png"
                  aria-invalid={Boolean(errors.imageUrl)}
                  {...register("imageUrl")}
                />
              </div>
              {errors.imageUrl && <p className="field-error">{errors.imageUrl.message}</p>}
              <p className="mt-1 text-xs text-muted">
                Use a public HTTP(S) image URL, or upload a file after the product is created.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="flex items-center gap-2.5 rounded-xl border border-line bg-page/50 p-3.5 text-sm font-semibold">
                <input type="checkbox" className="h-4 w-4 accent-accent" {...register("isActive")} />
                Publish immediately
                <span className="font-normal text-muted">(active in the public catalogue)</span>
              </label>
            </div>
          </>
        )}
      </div>

      {isEdit && (
        <div className="flex items-start gap-2 rounded-xl border border-line bg-page/60 p-3.5 text-xs leading-relaxed text-muted">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
          Product images are not sent with this update. Use the image tools on this page to upload
          or replace files without destructively rewriting existing image records.
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
          <p className="font-bold">Could not save product</p>
          <p className="mt-1">{error.message}</p>
          {Array.isArray(error.issues) && error.issues.length > 0 && (
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
              {error.issues.map((issue, index) => (
                <li key={index}>
                  {issue.path?.join(".")}: {issue.message}
                </li>
              ))}
            </ul>
          )}
          {error.status >= 500 && (
            <p className="mt-1 text-xs">
              Duplicate slugs may surface as a generic server error. Try a different slug.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          loading={isPending || isSubmitting}
          disabled={categoriesUnavailable}
        >
          <Save size={16} aria-hidden="true" />
          {isEdit ? "Save changes" : "Create product"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button as={Link} to={cancelTo} variant="secondary">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
