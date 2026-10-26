import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  ShoppingBag,
} from "lucide-react";
import { useAdminAuthStore } from "../../store/adminAuthStore";
import { logout } from "../../services/adminAuth";
import { cn } from "../../lib/format";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const admin = useAdminAuthStore((state) => state.admin);
  const clearSession = useAdminAuthStore((state) => state.clearSession);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Logout is client-authoritative for Bearer sessions.
    } finally {
      clearSession();
      queryClient.removeQueries({ queryKey: ["admin"] });
      navigate("/admin/login", { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="mx-auto flex w-full max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-white px-4 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-line bg-white">
              <img src="/logo.svg" alt="" className="h-7 w-7 object-contain" />
            </span>
            <div>
              <p className="text-lg font-extrabold leading-none tracking-tight">KubeCart</p>
              <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted">
                Admin workspace
              </p>
            </div>
          </div>

          <nav className="mt-8 space-y-1" aria-label="Admin navigation">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                    isActive
                      ? "bg-deep text-white"
                      : "text-muted hover:bg-page hover:text-ink"
                  )
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-2xl bg-page p-3.5">
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Signed in as</p>
            <p className="mt-2 truncate text-sm font-bold">{admin?.name || "Administrator"}</p>
            <p className="truncate text-xs text-muted">{admin?.email}</p>
          </div>

          <div className="mt-auto space-y-2 pt-6">
            <a
              href="/"
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-page hover:text-ink"
            >
              View storefront
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut size={17} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2 lg:hidden">
                <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-line bg-white">
                  <img src="/logo.svg" alt="" className="h-6 w-6 object-contain" />
                </span>
                <span className="font-extrabold tracking-tight">KubeCart Admin</span>
              </div>
              <div className="hidden items-center gap-2 text-xs text-muted lg:flex">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                Server-backed admin session
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/"
                  className="hidden rounded-full border border-line px-3 py-1.5 text-xs font-bold sm:inline-flex"
                >
                  Storefront
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs font-bold text-muted transition hover:border-red-200 hover:text-red-700 lg:hidden"
                >
                  <LogOut size={14} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </div>

            <nav className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden" aria-label="Admin navigation">
              {navItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition",
                      isActive ? "bg-deep text-white" : "text-muted hover:bg-page"
                    )
                  }
                >
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto max-w-6xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
