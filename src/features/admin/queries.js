import { useQuery } from "@tanstack/react-query";
import { getMe } from "../../services/adminAuth";
import { getOrder, listOrders } from "../../services/admin";
import { queryKeys } from "../../lib/queryKeys";

export function useAdminMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.admin.me,
    queryFn: getMe,
    staleTime: 5 * 60_000,
    retry: false,
    enabled,
    select: (response) => response?.admin || null,
  });
}

export function useAdminOrders(params = {}) {
  return useQuery({
    queryKey: queryKeys.admin.orders(params),
    queryFn: () => listOrders(params),
    staleTime: 15_000,
    placeholderData: (previous) => previous,
  });
}

export function useAdminOrder(reference) {
  return useQuery({
    queryKey: queryKeys.admin.order(reference),
    queryFn: () => getOrder(reference),
    enabled: Boolean(reference),
    staleTime: 15_000,
    select: (response) => response?.data || null,
  });
}
