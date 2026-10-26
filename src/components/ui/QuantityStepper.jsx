import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max,
  disabled = false,
  label = "Quantity",
}) {
  const upper = Number.isFinite(max) ? max : undefined;

  function set(next) {
    if (disabled) return;
    const bounded = Math.max(min, upper ? Math.min(upper, next) : next);
    onChange(bounded);
  }

  return (
    <div className="inline-flex items-center rounded-full border border-line bg-white">
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= min}
        className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-page disabled:opacity-40"
        aria-label={`Decrease ${label.toLowerCase()}`}
      >
        <Minus size={15} aria-hidden="true" />
      </button>
      <span className="min-w-9 text-center text-sm font-bold" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={disabled || (upper !== undefined && value >= upper)}
        className="grid h-9 w-9 place-items-center rounded-full text-ink transition hover:bg-page disabled:opacity-40"
        aria-label={`Increase ${label.toLowerCase()}`}
      >
        <Plus size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
