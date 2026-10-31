import { Link } from "react-router-dom";
import { Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t-4 border-accent bg-ink">
      <div
        className="pointer-events-none absolute -right-28 -top-40 h-64 w-64 rounded-full border border-white/10"
        aria-hidden="true"
      />
      <div className="page-container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2.5" aria-label="KubeCart home">
            <img src="/logo.svg" alt="" width="40" height="40" className="h-10 w-10 rounded-xl" />
            <span className="text-xl font-extrabold tracking-[-0.05em] text-white">KubeCart</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/65">
            Shop smarter with premium essentials for home, tech, fashion, and everyday life.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <span className="grid shrink-0 place-items-center rounded-xl bg-white p-1.5">
              <img
                src="/DynaTechMinds-320x200.png"
                alt="Dyna Tech Minds"
                width="320"
                height="200"
                loading="lazy"
                decoding="async"
                className="h-12 w-auto"
              />
            </span>
            <span className="text-xs leading-relaxed text-white/50">
              A product of <span className="font-semibold text-white/75">Dyna Tech Minds</span>
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Shop</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li><Link className="hover:text-white" to="/products">All products</Link></li>
            <li><Link className="hover:text-white" to="/new-arrivals">New arrivals</Link></li>
            <li><Link className="hover:text-white" to="/search">Search</Link></li>
            <li><Link className="hover:text-white" to="/cart">Your cart</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Company</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li><Link className="hover:text-white" to="/contact">Contact us</Link></li>
            <li><Link className="hover:text-white" to="/order">Track an order</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">Customer care</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/65">
            <li>
              <a className="inline-flex items-center gap-2 hover:text-white" href="tel:+2348167263662">
                <Phone size={14} aria-hidden="true" />
                +234 816 726 3662
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-2 hover:text-white" href="tel:+2348033522914">
                <Phone size={14} aria-hidden="true" />
                +234 803 352 2914
              </a>
            </li>
            <li>
              <a className="inline-flex items-center gap-2 hover:text-white" href="tel:+2348063532990">
                <Phone size={14} aria-hidden="true" />
                +234 806 353 2990
              </a>
            </li>
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-white/45">
            Keep your order reference and payment reference close when contacting support.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="page-container flex flex-col justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <span>© 2026 KubeCart. All rights reserved.</span>
          <span>Prices and delivery totals are confirmed by the server at checkout.</span>
        </div>
      </div>
    </footer>
  );
}
