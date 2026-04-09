import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-ink-200">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-cosmos-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-ink-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30",
              "focus:outline-none focus:border-cosmos-500 focus:ring-1 focus:ring-cosmos-500/50",
              "transition-all duration-200",
              icon && "pl-10",
              error && "border-ember-500/50 focus:border-ember-500",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-ember-400 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
