import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { formatMoney, getPrimaryImage } from "../../lib/format";
import ProductImage from "./ProductImage";
import Button from "./Button";
import { useCartStore } from "../../store/cartStore";

export default function ProductCard({ product, priority = false }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const image = getPrimaryImage(product.images);
  const outOfStock = Number(product.stock) <= 0;

  function handleAdd() {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      priceKobo: product.priceKobo,
      stock: product.stock,
      imageUrl: image?.url,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1200);
  }

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-card transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative">
        <Link to={`/products/${product.slug}`} aria-label={`View ${product.name}`}>
          <ProductImage
            src={image?.url}
            alt={product.name}
            priority={priority}
            className="aspect-[4/3] w-full"
            imageClassName="transition duration-500 group-hover:scale-[1.03]"
          />
        </Link>
        <span className="absolute left-4 top-4 rounded-full border border-white/80 bg-white/80 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-ink backdrop-blur">
          {product.category?.name || "KubeCart"}
        </span>
        {outOfStock && (
          <span className="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-white">
            Out of stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>{product.category?.name || "Product"}</span>
          <span>{outOfStock ? "Unavailable" : `${product.stock} in stock`}</span>
        </div>
        <h3 className="mt-2.5 text-lg font-bold leading-snug tracking-tight">
          <Link to={`/products/${product.slug}`} className="hover:text-accent">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
          {product.description}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <strong className="text-xl tracking-tight">{formatMoney(product.priceKobo)}</strong>
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={outOfStock}
            aria-label={`Add ${product.name} to cart`}
            className="shrink-0"
          >
            <ShoppingBag size={15} aria-hidden="true" />
            {added ? "Added" : "Add to cart"}
          </Button>
        </div>
      </div>
    </article>
  );
}
