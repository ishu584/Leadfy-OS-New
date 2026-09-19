import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...props
}) => {
  const variantStyles = {
    primary: "bg-amber-500 hover:bg-amber-400 text-charcoal font-semibold shadow-sm active:translate-y-[1px]",
    secondary: "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 active:translate-y-[1px]",
    outline: "border border-zinc-700 hover:border-zinc-500 text-zinc-200 hover:bg-zinc-800/40",
    ghost: "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
    danger: "bg-rose-600/90 hover:bg-rose-500 text-white font-medium active:translate-y-[1px]",
  };

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs rounded-md",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-5 py-2.5 text-base rounded-lg",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
