import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftAddon,
  className = "",
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-sm">
        {leftAddon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-medium text-sm">
            {leftAddon}
          </div>
        )}
        <input
          id={inputId}
          className={`block w-full rounded-lg border ${
            error
              ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500"
              : "border-slate-300 focus:border-teal-500 focus:ring-teal-500"
          } ${
            leftAddon ? "pl-10" : "px-3.5"
          } py-2.5 text-sm text-slate-800 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {!error && helperText && (
        <p className="text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
};
