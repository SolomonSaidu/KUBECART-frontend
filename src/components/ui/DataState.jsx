import { AlertTriangle, PackageOpen, RefreshCw } from "lucide-react";
import Button from "./Button";
import { getErrorMessage } from "../../lib/format";

export function ErrorState({
  error,
  title = "Could not load this page",
  description,
  onRetry,
  retrying = false,
  compact = false,
}) {
  return (
    <div
      role="alert"
      className={
        compact
          ? "rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          : "rounded-3xl border border-red-200 bg-white p-8 text-center shadow-soft"
      }
    >
      <div className={compact ? "flex items-start gap-2" : "mx-auto max-w-lg"}>
        <AlertTriangle
          size={compact ? 18 : 28}
          className={compact ? "mt-0.5 shrink-0" : "mx-auto mb-4 text-red-500"}
          aria-hidden="true"
        />
        <div>
          <h2 className={compact ? "font-bold" : "text-xl font-bold text-ink"}>{title}</h2>
          <p className={compact ? "mt-1" : "mt-2 text-sm leading-relaxed text-muted"}>
            {description || getErrorMessage(error)}
          </p>
          {error?.requestId && (
            <p className="mt-2 text-xs text-muted">Request ID: {error.requestId}</p>
          )}
          {onRetry && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onRetry}
              loading={retrying}
              className={compact ? "mt-3" : "mt-5"}
            >
              <RefreshCw size={15} aria-hidden="true" />
              Try again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title = "Nothing here yet",
  description,
  action,
  icon: Icon = PackageOpen,
}) {
  return (
    <div className="rounded-3xl border border-dashed border-ink/15 bg-white/70 px-6 py-14 text-center">
      <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#fff3ee] to-[#edf4ff] text-accent">
        <Icon size={28} aria-hidden="true" />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-ink">{title}</h2>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-3xl border border-line bg-white">
          <div className="skeleton aspect-[4/3] w-full" />
          <div className="space-y-3 p-5">
            <div className="skeleton h-3 w-24 rounded-full" />
            <div className="skeleton h-5 w-3/4 rounded-full" />
            <div className="flex items-center justify-between pt-2">
              <div className="skeleton h-6 w-20 rounded-full" />
              <div className="skeleton h-9 w-24 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
