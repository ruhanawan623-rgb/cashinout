import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "emerald" | "rose" | "amber" | "blue" | "slate" | "indigo" | "teal";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "slate",
  size = "sm",
  className = "",
  ...props
}) => {
  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium rounded-md",
    md: "px-2.5 py-1 text-xs font-medium rounded-md",
  };

  const variantStyles = {
    emerald: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
    rose: "bg-rose-50 text-rose-700 border border-rose-200/80",
    amber: "bg-amber-50 text-amber-800 border border-amber-200/80",
    blue: "bg-blue-50 text-blue-700 border border-blue-200/80",
    slate: "bg-slate-100 text-slate-700 border border-slate-200/80",
    indigo: "bg-indigo-50 text-indigo-700 border border-indigo-200/80",
    teal: "bg-teal-50 text-teal-700 border border-teal-200/80",
  };

  return (
    <span
      className={`inline-flex items-center tracking-normal ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
