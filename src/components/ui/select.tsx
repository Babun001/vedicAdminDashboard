import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-ink-200">{label}</label>
        )}
        <select
          ref={ref}
          className={cn(
            "w-full bg-ink-900/60 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white",
            "focus:outline-none focus:border-cosmos-500 focus:ring-1 focus:ring-cosmos-500/50",
            "transition-all duration-200 appearance-none cursor-pointer",
            error && "border-ember-500/50",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-ink-900 text-white">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-ember-400">⚠ {error}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
