import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "amber" | "success" | "warning" | "danger" | "info" | "neutral";
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  size = "sm",
  className,
  ...props
}) => {
  const variantStyles = {
    default: "bg-zinc-800 text-zinc-300 border-zinc-700",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/30",
    neutral: "bg-zinc-900 text-zinc-400 border-zinc-800",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium rounded-md border tracking-wide",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
