import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label className="text-xs text-base-content/60 ml-1 font-semibold">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`input bg-base-200 w-full focus:outline-none focus:border-primary disabled:opacity-70 ${
            error ? "border-error focus:border-error" : ""
          } ${className}`}
          {...props}
        />
        {error && (
          <span className="text-xs text-error ml-1">{error}</span>
        )}
        {!error && helperText && (
          <span className="text-xs text-base-content/60 ml-1">{helperText}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
