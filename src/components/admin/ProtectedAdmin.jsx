import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminMe } from "../../features/admin/queries";
import { useAdminAuthStore } from "../../store/adminAuthStore";
import { PageLoading } from "../../components/ui/Spinner";
import { ErrorState } from "../../components/ui/DataState";
import AdminLayout from "./AdminLayout";

export default function ProtectedAdmin() {
  const token = useAdminAuthStore((state) => state.token);
  const setAdmin = useAdminAuthStore((state) => state.setAdmin);
  const clearSession = useAdminAuthStore((state) => state.clearSession);
  const location = useLocation();
  const meQuery = useAdminMe(Boolean(token));

  useEffect(() => {
    if (meQuery.data) setAdmin(meQuery.data);
  }, [meQuery.data, setAdmin]);

  if (!token) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  if (meQuery.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-page">
        <PageLoading label="Checking admin session" />
      </div>
    );
  }

  if (meQuery.isError) {
    if (meQuery.error?.status === 401) {
      return <Navigate to="/admin/login" replace state={{ from: location }} />;
    }
    return (
      <div className="grid min-h-screen place-items-center bg-page p-4">
        <div className="w-full max-w-lg">
          <ErrorState
            error={meQuery.error}
            title="Could not restore your admin session"
            onRetry={() => meQuery.refetch()}
          />
          <button
            type="button"
            onClick={clearSession}
            className="mx-auto mt-4 block text-sm font-semibold text-muted underline"
          >
            Sign out and return to login
          </button>
        </div>
      </div>
    );
  }

  return <AdminLayout />;
}
