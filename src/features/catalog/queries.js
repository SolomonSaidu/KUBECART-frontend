import { useQuery } from "@tanstack/react-query";
import { getCategories, getProduct, getProducts } from "../../services/catalog";
import { queryKeys } from "../../lib/queryKeys";

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: getCategories,
    select: (response) => response?.data || [],
  });
}

export function useProducts(params = {}, options = {}) {
  return useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => getProducts(params),
    placeholderData: (previous) => previous,
    ...options,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => getProduct(slug),
    enabled: Boolean(slug),
    select: (response) => response?.data || null,
  });
}
