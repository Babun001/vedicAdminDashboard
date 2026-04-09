import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getPlanColor(plan: string): string {
  switch (plan) {
    case "premium": return "text-gold-400 bg-gold-400/10 border-gold-400/30";
    case "modern":  return "text-cosmos-300 bg-cosmos-500/10 border-cosmos-400/30";
    case "free":    return "text-ink-200 bg-white/5 border-white/10";
    default:        return "text-ink-200 bg-white/5 border-white/10";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "active":
    case "success":   return "text-jade-400 bg-jade-400/10 border-jade-400/30";
    case "pending":   return "text-gold-400 bg-gold-400/10 border-gold-400/30";
    case "inactive":
    case "expired":
    case "cancelled":
    case "failed":    return "text-ember-400 bg-ember-400/10 border-ember-400/30";
    case "refunded":  return "text-cosmos-300 bg-cosmos-400/10 border-cosmos-400/30";
    default:          return "text-ink-200 bg-white/5 border-white/10";
  }
}

export function getReportStatusColor(status: string): string {
  switch (status) {
    case "sent":    return "text-jade-400 bg-jade-400/10 border-jade-400/30";
    case "created": return "text-gold-400 bg-gold-400/10 border-gold-400/30";
    case "draft":   return "text-cosmos-300 bg-cosmos-400/10 border-cosmos-400/30";
    default:        return "text-ink-200 bg-white/5 border-white/10";
  }
}

// Generate fake TOTP code for demo
export function generateMockTOTP(): string {
  return "123456";
}
