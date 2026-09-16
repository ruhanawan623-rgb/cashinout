import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  subtitle,
  headerAction,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden ${className}`}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            {title && (
              <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
};
