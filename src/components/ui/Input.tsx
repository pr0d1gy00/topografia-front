import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-text-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-2.5 bg-white border rounded-lg outline-none transition-all duration-200 
            ${error 
              ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100" 
              : "border-border focus:border-primary focus:ring-2 focus:ring-indigo-50 text-text-main placeholder:text-slate-400"
            } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
      </div>
    );
  }
);