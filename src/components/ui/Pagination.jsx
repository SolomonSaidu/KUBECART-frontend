import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/format";

export default function Pagination({ pagination, onPageChange, className }) {
  if (!pagination) return null;
  const { page, totalPages, total } = pagination;
  if (!total || totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex flex-wrap items-center justify-between gap-4", className)}
    >
      <p className="text-sm text-muted">
        Page <span className="font-semibold text-ink">{page}</span> of {totalPages} · {total}{" "}
        {total === 1 ? "item" : "items"}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-10 items-center gap-1 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-ink/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Previous
        </button>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-10 items-center gap-1 rounded-full border border-line bg-white px-4 text-sm font-semibold text-ink transition hover:border-ink/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
