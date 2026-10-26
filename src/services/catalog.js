import { request } from "./client";

export function getCategories() {
  return request("/categories");
}

export function getCategory(slug) {
  return request(`/categories/${encodeURIComponent(slug)}`);
}

export function getProducts({ page = 1, limit = 12, search, categorySlug, categoryId, sort } = {}) {
  return request("/products", {
    query: { page, limit, search, categorySlug, categoryId, sort },
  });
}

export function getProduct(slug) {
  return request(`/products/${encodeURIComponent(slug)}`);
}
