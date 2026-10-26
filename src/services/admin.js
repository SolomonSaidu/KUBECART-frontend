import { request } from "./client";

export function listOrders(params = {}) {
  return request("/admin/orders", { auth: true, query: params });
}

export function getOrder(reference) {
  return request(`/admin/orders/${encodeURIComponent(reference)}`, { auth: true });
}

export function updateFulfillment(reference, { status, note }) {
  return request(`/admin/orders/${encodeURIComponent(reference)}/fulfillment`, {
    method: "PATCH",
    auth: true,
    body: { status, ...(note ? { note } : {}) },
  });
}

export function createCategory(payload) {
  return request("/admin/categories", { method: "POST", auth: true, body: payload });
}

export function updateCategory(id, payload) {
  return request(`/admin/categories/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function deleteCategory(id) {
  return request(`/admin/categories/${encodeURIComponent(id)}`, {
    method: "DELETE",
    auth: true,
  });
}

export function createProduct(payload) {
  return request("/admin/products", { method: "POST", auth: true, body: payload });
}

export function updateProduct(id, payload) {
  return request(`/admin/products/${encodeURIComponent(id)}`, {
    method: "PUT",
    auth: true,
    body: payload,
  });
}

export function activateProduct(id) {
  return request(`/admin/products/${encodeURIComponent(id)}/activate`, {
    method: "PATCH",
    auth: true,
  });
}

export function deactivateProduct(id) {
  return request(`/admin/products/${encodeURIComponent(id)}/deactivate`, {
    method: "PATCH",
    auth: true,
  });
}

export function uploadProductImage(productId, { file, isPrimary, sortOrder, replaceImageId }) {
  const form = new FormData();
  form.append("image", file);
  if (typeof isPrimary === "boolean") form.append("isPrimary", String(isPrimary));
  if (sortOrder !== undefined && sortOrder !== null && sortOrder !== "") {
    form.append("sortOrder", String(sortOrder));
  }
  if (replaceImageId) form.append("replaceImageId", replaceImageId);

  return request(`/admin/products/${encodeURIComponent(productId)}/image`, {
    method: "POST",
    auth: true,
    body: form,
  });
}
