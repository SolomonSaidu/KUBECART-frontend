import { useQuery } from "@tanstack/react-query";
import { getPublicOrder } from "../../services/orders";
import { queryKeys } from "../../lib/queryKeys";

export function usePublicOrder(reference, { poll = false } = {}) {
  return useQuery({
    queryKey: queryKeys.publicOrder(reference),
    queryFn: () => getPublicOrder(reference),
    enabled: Boolean(reference),
    select: (response) => response?.data || null,
    refetchInterval: (query) => {
      if (!poll) return false;
      const order = query.state.data?.data;
      if (!order) return false;
      return order.paymentStatus === "UNPAID" && order.status === "PENDING" ? 15_000 : false;
    },
  });
}
