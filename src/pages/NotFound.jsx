import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import useDocumentTitle from "../hooks/useDocumentTitle";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  useDocumentTitle("Page Not Found");
  const location = useLocation();

  return (
    <main className="py-16">
      <div className="page-container">
        <div className="mx-auto max-w-2xl rounded-[30px] border border-line bg-white p-8 text-center shadow-soft sm:p-12">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-accent/10 text-accent">
            <Compass size={32} aria-hidden="true" />
          </div>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-muted">404</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.05em] sm:text-4xl">
            This page is off the shelf
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            We could not find <code className="break-all rounded bg-page px-1.5 py-0.5">{location.pathname}</code>.
            The link may be outdated, or the product may no longer be available.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button as={Link} to="/">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to home
            </Button>
            <Button as={Link} to="/products" variant="secondary">
              Browse the shop
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
