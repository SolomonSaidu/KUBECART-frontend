import { request } from "./client";

export function login({ email, password }) {
  return request("/admin/login", {
    method: "POST",
    body: { email, password },
  });
}

export function bootstrapAdmin({ email, password, name }) {
  return request("/admin/bootstrap", {
    method: "POST",
    body: { email, password, name },
  });
}

export function logout() {
  return request("/admin/logout", { method: "POST", auth: true });
}

export function getMe() {
  return request("/admin/me", { auth: true });
}
