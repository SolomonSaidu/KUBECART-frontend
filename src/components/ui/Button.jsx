import { Loader2 } from "lucide-react";
import { cn } from "../../lib/format";

const variants = {
  primary:
    "bg-accent text-white shadow-[0_12px_24px_rgba(255,107,53,0.2)] hover:bg-[#f25d27]",
  secondary:
    "border border-line bg-white/70 text-ink hover:border-ink/20 hover:bg-white",
  dark: "bg-deep text-white hover:bg-[#2a3244]",
  ghost: "text-ink hover:bg-deep/[0.06]",
  danger: "bg-red-600 text-white hover:bg-red-700",
  outlineDanger:
    "border border-red-200 bg-white text-red-700 hover:border-red-300 hover:bg-red-50",
  outline: "border border-line bg-transparent text-ink hover:border-ink/20 hover:bg-white",
};

const sizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3.5 text-base",
};

export function buttonClasses(variant = "primary", size = "md", className) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );
}

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  if (Tag === "button") {
    return (
      <button
        className={buttonClasses(variant, size, className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }

  return (
    <Tag className={buttonClasses(variant, size, className)} {...props}>
      {children}
    </Tag>
  );
}
