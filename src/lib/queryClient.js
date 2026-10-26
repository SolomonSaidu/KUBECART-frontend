import { QueryClient } from "@tanstack/react-query";

function shouldRetry(failureCount, error) {
  if (error?.status && error.status < 500) return false;
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 30 * 60_000,
      retry: shouldRetry,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: false,
    },
  },
});
