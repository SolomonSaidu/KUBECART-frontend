import { Loader2 } from "lucide-react";
import { cn } from "../../lib/format";

export function Spinner({ size = 20, className }) {
  return (
    <Loader2
      size={size}
      className={cn("animate-spin text-accent", className)}
      aria-hidden="true"
    />
  );
}

export function PageLoading({ label = "Loading" }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted">
      <Spinner size={28} />
      <span className="text-sm font-medium">{label}…</span>
    </div>
  );
}

export function InlineLoading({ label = "Working" }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <Spinner size={16} />
      {label}…
    </span>
  );
}
