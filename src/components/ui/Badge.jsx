import { cn } from "../../lib/format";

const styles = {
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200",
  red: "bg-red-50 text-red-700 border-red-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  dark: "bg-deep text-white border-deep",
};

const statusMap = {
  PENDING: "amber",
  CONFIRMED: "green",
  CANCELLED: "red",
  UNPAID: "amber",
  PAID: "green",
  REFUNDED: "blue",
  UNFULFILLED: "neutral",
  PROCESSING: "blue",
  FULFILLED: "green",
  SUCCESS: "green",
  FAILED: "red",
  ABANDONED: "neutral",
  ACTIVE: "green",
  CONSUMED: "neutral",
  RELEASED: "neutral",
  EXPIRED: "red",
};

export default function Badge({ children, tone = "neutral", status, className }) {
  const resolvedTone = status ? statusMap[status] || "neutral" : tone;
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wide",
        styles[resolvedTone],
        className
      )}
    >
      {children || status}
    </span>
  );
}
