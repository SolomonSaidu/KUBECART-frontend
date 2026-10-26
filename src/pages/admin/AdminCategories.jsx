import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  FolderPlus,
  FolderTree,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useCategories } from "../../features/catalog/queries";
import { categorySchema } from "../../lib/schemas";
import { slugify } from "../../lib/format";
import { createCategory, deleteCategory, updateCategory } from "../../services/admin";
import Button from "../../components/ui/Button";
import { EmptyState, ErrorState } from "../../components/ui/DataState";

function ApiIssues({ issues }) {
  if (!Array.isArray(issues) || issues.length === 0) return null;
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
      {issues.map((issue, index) => (
        <li key={`${issue.path?.join?.(".") || "issue"}-${index}`}>
          {issue.path?.join(".")}: {issue.message}
        </li>
      ))}
    </ul>
  );
}

export default function AdminCategoriesPage() {
  useDocumentTitle("Admin Categories");
  const queryClient = useQueryClient();
  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data || [];

  const [editing, setEditing] = useState(null);
  const [autoSlug, setAutoSlug] = useState(true);
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", description: "" },
  });

  const nameValue = watch("name");

  useEffect(() => {
    if (editing) {
      reset({
        name: editing.name || "",
        slug: editing.slug || "",
        description: editing.description || "",
      });
      setAutoSlug(false);
    } else {
      reset({ name: "", slug: "", description: "" });
      setAutoSlug(true);
    }
  }, [editing, reset]);

  const saveMutation = useMutation({
    mutationFn: (values) => {
      const payload = {
        name: values.name.trim(),
        slug: values.slug.trim(),
        ...(values.description?.trim()
          ? { description: values.description.trim() }
          : editing
            ? { description: null }
            : {}),
      };
      return editing ? updateCategory(editing.id, payload) : createCategory(payload);
    },
    onSuccess: () => {
      setSuccess(editing ? "Category updated." : "Category created.");
      setEditing(null);
      setAutoSlug(true);
      reset({ name: "", slug: "", description: "" });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: (_, id) => {
      setSuccess("Category deleted.");
      setDeletingId(null);
      if (editing?.id === id) setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: () => setDeletingId(null),
  });

  const saveError = saveMutation.error;
  const deleteError = deleteMutation.error;

  function startEdit(category) {
    setSuccess("");
    saveMutation.reset();
    deleteMutation.reset();
    setDeletingId(null);
    setEditing(category);
  }

  function cancelEdit() {
    setEditing(null);
    setAutoSlug(true);
    saveMutation.reset();
    reset({ name: "", slug: "", description: "" });
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow-dark">Catalogue</span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">
            Categories
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            Category reads use the public category API because the admin API has no category-list
            endpoint. Product counts include active products only.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white px-4 py-3 text-right shadow-soft">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Categories</p>
          <p className="mt-1 text-2xl font-extrabold">{categories.length}</p>
        </div>
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

      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[1.45fr_0.9fr]">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight">Existing categories</h2>
            <button
              type="button"
              onClick={() => categoriesQuery.refetch()}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-ink"
            >
              <RefreshCw
                size={14}
                className={categoriesQuery.isFetching ? "animate-spin" : ""}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>

          {categoriesQuery.isLoading ? (
            <div className="mt-5 space-y-3" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <div key={index} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : categoriesQuery.isError ? (
            <div className="mt-4">
              <ErrorState
                compact
                error={categoriesQuery.error}
                title="Could not load categories"
                onRetry={() => categoriesQuery.refetch()}
              />
            </div>
          ) : categories.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={FolderTree}
                title="No categories yet"
                description="Create the first category before adding products."
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {categories.map((category) => (
                <li
                  key={category.id}
                  className={
                    editing?.id === category.id
                      ? "rounded-xl border border-accent/40 bg-accent/[0.04] p-4"
                      : "rounded-xl border border-line bg-white p-4"
                  }
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold">{category.name}</p>
                      <p className="mt-0.5 text-xs text-muted">/{category.slug}</p>
                      {category.description && (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted">
                          {category.description}
                        </p>
                      )}
                      <p className="mt-2 text-[0.7rem] font-bold uppercase tracking-wide text-muted">
                        {category._count?.products ?? 0} active{" "}
                        {category._count?.products === 1 ? "product" : "products"}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => startEdit(category)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition hover:text-ink"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </button>
                      {deletingId === category.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(category.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-full bg-red-600 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                          >
                            {deleteMutation.isPending ? "Deleting…" : "Confirm"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(null)}
                            className="rounded-full border border-line px-2.5 py-1.5 text-xs font-bold"
                          >
                            Keep
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingId(category.id);
                            deleteMutation.reset();
                          }}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition hover:border-red-200 hover:text-red-700"
                          aria-label={`Delete ${category.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {deleteError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
              <p className="font-bold">Category could not be deleted</p>
              <p className="mt-1">{deleteError.message}</p>
              <p className="mt-1 text-xs">
                Products may still reference this category. Reassign or deactivate those products
                first. The API may return a generic error for this database constraint.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 shadow-soft xl:sticky xl:top-24">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FolderPlus size={18} className="text-accent" aria-hidden="true" />
                <h2 className="text-lg font-extrabold tracking-tight">
                  {editing ? "Edit category" : "New category"}
                </h2>
              </div>
              <p className="mt-1 text-xs text-muted">
                {editing ? `Updating /${editing.slug}` : "Create a category for products."}
              </p>
            </div>
            {editing && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-full p-1.5 text-muted hover:bg-page hover:text-ink"
                aria-label="Cancel editing"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>

          <form
            onSubmit={handleSubmit((values) => {
              setSuccess("");
              saveMutation.mutate(values);
            })}
            className="mt-5 space-y-4"
            noValidate
          >
            <div>
              <label htmlFor="category-name" className="field-label">
                Name
              </label>
              <input
                id="category-name"
                className="field-input"
                placeholder="e.g. Smartphones"
                maxLength={100}
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
                <label htmlFor="category-slug" className="field-label">
                  Slug
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAutoSlug(true);
                    setValue("slug", slugify(nameValue), { shouldValidate: true });
                  }}
                  className="mb-2 text-[0.7rem] font-bold text-accent hover:underline"
                >
                  Generate from name
                </button>
              </div>
              <input
                id="category-slug"
                className="field-input font-mono text-sm"
                placeholder="smartphones"
                maxLength={100}
                aria-invalid={Boolean(errors.slug)}
                {...register("slug", {
                  onChange: () => setAutoSlug(false),
                })}
              />
              {errors.slug && <p className="field-error">{errors.slug.message}</p>}
              <p className="mt-1.5 text-xs text-muted">Lowercase letters, numbers, and hyphens.</p>
            </div>

            <div>
              <label htmlFor="category-description" className="field-label">
                Description <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id="category-description"
                rows={3}
                className="field-input resize-y"
                placeholder="Short category description"
                {...register("description")}
              />
            </div>

            {saveError && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-bold">Could not save category</p>
                <p className="mt-1">{saveError.message}</p>
                <ApiIssues issues={saveError.issues} />
                {saveError.status >= 500 && (
                  <p className="mt-1 text-xs">
                    Duplicate names or slugs may surface as a generic server error.
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                className="flex-1"
                loading={saveMutation.isPending || isSubmitting}
              >
                {editing ? "Save changes" : "Create category"}
              </Button>
              {editing && (
                <Button type="button" variant="secondary" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
