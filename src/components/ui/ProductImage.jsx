import { useEffect, useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "../../lib/format";

export default function ProductImage({
  src,
  alt = "",
  className,
  imageClassName,
  priority = false,
  showFallbackLabel = false,
  onError,
}) {
  const [status, setStatus] = useState(src ? "loading" : "error");

  useEffect(() => {
    setStatus(src ? "loading" : "error");
  }, [src]);

  function handleError() {
    setStatus("error");
    if (typeof onError === "function") onError();
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-[#eef3ff] via-[#f7f8ff] to-[#fff3ee]",
        className
      )}
    >
      {src && status !== "error" && (
        <img
          src={src}
          alt={alt}
          width={900}
          height={900}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
          onLoad={() => setStatus("loaded")}
          onError={handleError}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300",
            status === "loading" ? "opacity-0" : "opacity-100",
            imageClassName
          )}
        />
      )}

      {status === "loading" && (
        <div className="skeleton absolute inset-0" aria-hidden="true" />
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3 text-center text-muted">
          <ImageOff size={showFallbackLabel ? 34 : 22} aria-hidden="true" />
          {showFallbackLabel && <span className="text-xs font-medium">Image unavailable</span>}
        </div>
      )}
    </div>
  );
}
