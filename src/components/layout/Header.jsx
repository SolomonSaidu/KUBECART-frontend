import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { cn } from "../../lib/format";
import { selectCartCount, useCartStore } from "../../store/cartStore";

const navItems = [
  { to: "/", label: "Home", end: true },
  { to: "/products", label: "Shop" },
  { to: "/new-arrivals", label: "New Arrivals" },
  { to: "/order", label: "Track Order" },
  { to: "/contact", label: "Contact" },
];

function CartPill({ compact = false }) {
  const count = useCartStore(selectCartCount);
  return (
    <Link
      to="/cart"
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-deep px-4 py-3 font-semibold text-white transition hover:bg-[#2a3244]",
        compact && "px-3.5 py-2.5 text-sm"
      )}
      aria-label={`Shopping cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <ShoppingBag size={17} aria-hidden="true" />
      <span>Cart</span>
      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.7rem] font-bold">
        {count}
      </span>
    </Link>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartStore(selectCartCount);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/85 backdrop-blur-xl">
      <div className="page-container flex min-h-[76px] items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="KubeCart home">
          <img
            src="/logo.svg"
            alt=""
            width="44"
            height="44"
            className="h-11 w-11 rounded-xl"
          />
          <span className="text-2xl font-extrabold tracking-[-0.06em] text-ink">KubeCart</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[0.95rem] text-muted lg:flex" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn("transition hover:text-accent", isActive && "font-bold text-accent")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <Link
            to="/search"
            className="hidden h-10 w-10 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-accent/40 hover:text-accent sm:grid"
            aria-label="Search products"
          >
            <Search size={18} aria-hidden="true" />
          </Link>
          <div className="hidden sm:block">
            <CartPill />
          </div>
          <Link
            to="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-line bg-white sm:hidden"
            aria-label="Shopping cart"
          >
            <ShoppingBag size={18} aria-hidden="true" />
            <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[0.65rem] font-bold text-white">
              {cartCount}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-line bg-white lg:hidden">
          <nav className="page-container flex flex-col py-3" aria-label="Mobile navigation">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl px-3 py-3 text-sm font-semibold transition",
                    isActive ? "bg-accent/10 text-accent" : "text-ink hover:bg-page"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/search"
              className="rounded-xl px-3 py-3 text-sm font-semibold text-ink transition hover:bg-page"
            >
              Search
            </NavLink>
            <div className="px-3 pb-2 pt-3">
              <CartPill compact />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
