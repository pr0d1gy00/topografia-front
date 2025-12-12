import React from "react";
import { CgSpinner } from "react-icons/cg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger";
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  isLoading,
  icon,
  className = "",
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer text-sm shadow-sm";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-hover shadow-indigo-200",
    secondary: "bg-white text-text-main border border-border hover:bg-slate-50 hover:border-slate-300",
    outline: "bg-transparent border border-primary text-primary hover:bg-indigo-50",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {isLoading ? <CgSpinner className="animate-spin text-lg" /> : icon}
      {children}
    </button>
  );
};