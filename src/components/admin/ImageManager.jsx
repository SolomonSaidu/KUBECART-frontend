import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Info, Upload } from "lucide-react";
import { uploadProductImage } from "../../services/admin";
import ProductImage from "../ui/ProductImage";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export default function ImageManager({ product, onImagesChange }) {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [images, setImages] = useState(product?.images || []);
  const [file, setFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(!(product?.images?.length > 0));
  const [sortOrder, setSortOrder] = useState(product?.images?.length || 0);
  const [replaceImageId, setReplaceImageId] = useState("");
  const [clientError, setClientError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setImages(product?.images || []);
    setIsPrimary(!(product?.images?.length > 0));
  }, [product?.id, product?.images]);

  const uploadMutation = useMutation({
    mutationFn: () =>
      uploadProductImage(product.id, {
        file,
        isPrimary,
        sortOrder: Number(sortOrder),
        replaceImageId: replaceImageId || undefined,
      }),
    onSuccess: (response) => {
      const image = response?.data;
      if (!image) return;
      let next = replaceImageId
        ? images.filter((item) => item.id !== replaceImageId)
        : [...images];
      next = [...next, image];
      if (image.isPrimary) {
        next = next.map((item) => ({ ...item, isPrimary: item.id === image.id }));
      }
      next.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
      setImages(next);
      if (typeof onImagesChange === "function") onImagesChange(next);
      setFile(null);
      setReplaceImageId("");
      setClientError("");
      setSuccess(response.message || "Product image uploaded.");
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product"] });
    },
  });

  function handleFileChange(event) {
    const selected = event.target.files?.[0] || null;
    setSuccess("");
    setClientError("");
    if (!selected) {
      setFile(null);
      return;
    }
    if (!ACCEPTED.includes(selected.type)) {
      setFile(null);
      setClientError("Choose a JPEG, PNG, or WebP image. The server checks the file bytes.");
      return;
    }
    if (selected.size > MAX_BYTES) {
      setFile(null);
      setClientError("The image is larger than the 5 MB upload limit.");
      return;
    }
    setFile(selected);
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSuccess("");
    setClientError("");
    if (!file) {
      setClientError("Choose an image file to upload.");
      return;
    }
    uploadMutation.mutate();
  }

  const error = uploadMutation.error;

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <ImagePlus size={18} className="text-accent" aria-hidden="true" />
        <h2 className="text-lg font-extrabold tracking-tight">Product images</h2>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Upload a new image or replace an existing one. There is no delete or reorder endpoint.
        Uploaded images use signed URLs that expire after about one hour; KubeCart refreshes the
        product record to request fresh URLs.
      </p>

      {images.length > 0 ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image) => (
            <div key={image.id} className="overflow-hidden rounded-xl border border-line">
              <ProductImage src={image.url} alt="" className="aspect-square w-full" />
              <div className="flex items-center justify-between gap-1.5 p-2">
                <span className="text-[0.65rem] font-bold uppercase tracking-wide text-muted">
                  Sort {image.sortOrder ?? 0}
                </span>
                {image.isPrimary ? (
                  <Badge tone="green">Primary</Badge>
                ) : (
                  <span className="text-[0.65rem] text-muted">Secondary</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line bg-page/50 px-4 py-8 text-center text-sm text-muted">
          No images on this product yet.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-line pt-4">
        <div>
          <label htmlFor="product-image-file" className="field-label">
            Image file
          </label>
          <input
            ref={fileRef}
            id="product-image-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-xl border border-line bg-[#fbfcfe] px-3 py-2.5 text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-deep file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
          />
          <p className="mt-1 text-xs text-muted">JPEG, PNG, or WebP · maximum 5 MB.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="image-sort-order" className="field-label">
              Sort order
            </label>
            <input
              id="image-sort-order"
              type="number"
              min="0"
              max="1000"
              step="1"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              className="field-input py-2.5"
            />
          </div>
          <div>
            <label htmlFor="replace-image" className="field-label">
              Replace image
            </label>
            <select
              id="replace-image"
              value={replaceImageId}
              onChange={(event) => {
                setReplaceImageId(event.target.value);
                const selected = images.find((image) => image.id === event.target.value);
                if (selected) setSortOrder(selected.sortOrder ?? 0);
              }}
              className="field-input py-2.5"
              disabled={images.length === 0}
            >
              <option value="">Upload as new</option>
              {images.map((image) => (
                <option key={image.id} value={image.id}>
                  Replace {image.isPrimary ? "primary" : "image"} · sort {image.sortOrder ?? 0}
                </option>
              ))}
            </select>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(event) => setIsPrimary(event.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Set as primary image
        </label>

        {clientError && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
            {clientError}
          </p>
        )}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
            <p className="font-bold">Image upload failed</p>
            <p className="mt-1">{error.message}</p>
          </div>
        )}
        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
            {success}
          </p>
        )}

        <Button type="submit" loading={uploadMutation.isPending} disabled={!file}>
          <Upload size={15} aria-hidden="true" />
          {replaceImageId ? "Replace image" : "Upload image"}
        </Button>
      </form>

      {product?.isActive === false && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 p-2.5 text-xs text-amber-900">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          This product is inactive, so its public record is unavailable. Image changes are kept in
          this admin session until the product is reactivated.
        </p>
      )}
    </section>
  );
}
