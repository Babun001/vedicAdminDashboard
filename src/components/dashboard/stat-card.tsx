import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  accent?: "cosmos" | "gold" | "jade" | "ember";
}

const accentMap = {
  cosmos: {
    icon: "bg-purple-100 text-purple-600 border-purple-200",
    border: "border-gray-200",
  },
  gold: {
    icon: "bg-yellow-100 text-yellow-600 border-yellow-200",
    border: "border-gray-200",
  },
  jade: {
    icon: "bg-green-100 text-green-600 border-green-200",
    border: "border-gray-200",
  },
  ember: {
    icon: "bg-orange-100 text-orange-600 border-orange-200",
    border: "border-gray-200",
  },
};

export function StatCard({
  title,
  value,
  change,
  icon,
  accent = "cosmos",
}: StatCardProps) {
  const styles = accentMap[accent];
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={cn(
        "relative bg-white border rounded-2xl p-6 shadow-sm",
        "hover:shadow-md transition-all duration-300 group",
        styles.border
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-body mb-1">
            {title}
          </p>

          <p className="text-3xl font-display font-bold text-gray-900">
            {value}
          </p>

          {change !== undefined && (
            <div
              className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                isPositive ? "text-green-600" : "text-red-500"
              )}
            >
              {isPositive ? (
                <TrendingUp size={12} />
              ) : (
                <TrendingDown size={12} />
              )}
              <span>{Math.abs(change)}% from last month</span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center border text-lg",
            styles.icon
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}