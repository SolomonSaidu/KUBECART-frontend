const KEY = "kubecart:tracked-products";

function read() {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const value = sessionStorage.getItem(KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(products) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(products));
}

export function getTrackedProducts() {
  return read();
}

export function trackProduct(product) {
  if (!product?.id) return;
  const products = read().filter((item) => item.id !== product.id);
  products.unshift(product);
  write(products);
}

export function untrackProduct(id) {
  write(read().filter((item) => item.id !== id));
}

export function findTrackedProduct(slug) {
  return read().find((item) => item.slug === slug) || null;
}
