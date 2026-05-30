import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Badge ──────────────────────────────────────────────────────────

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default: "bg-surface-muted text-gray-300",
  success: "bg-green-500/20 text-green-400",
  warning: "bg-yellow-500/20 text-yellow-400",
  danger: "bg-red-500/20 text-red-400",
  info: "bg-brand-500/20 text-brand-400",
};

export function Badge({ variant = "default", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// ── Spinner ────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "w-5 h-5 border-2 border-surface-muted border-t-brand-500 rounded-full animate-spin",
        className
      )}
    />
  );
}

// ── Avatar ─────────────────────────────────────────────────────────

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const avatarSizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return src ? (
    <img
      src={src}
      alt={name}
      className={cn("rounded-full object-cover", avatarSizes[size], className)}
    />
  ) : (
    <div
      className={cn(
        "rounded-full bg-brand-500/20 text-brand-400 font-semibold flex items-center justify-center",
        avatarSizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

// ── Star Rating ────────────────────────────────────────────────────

export function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} className={cn("w-3.5 h-3.5", i < Math.round(rating) ? "text-yellow-400" : "text-surface-muted")} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

// ── Price display ──────────────────────────────────────────────────

export function Price({ paise, className }: { paise: number; className?: string }) {
  return (
    <span className={cn("font-semibold", className)}>
      ₹{(paise / 100).toFixed(0)}
    </span>
  );
}

// Re-export
export * from "lucide-react";
