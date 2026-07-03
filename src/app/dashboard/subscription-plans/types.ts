export type Currency = "INR" | "USD";

export type PlanStatus = "active" | "inactive";

export interface SubscriptionPlan {
  _id: string;
  name: string;
  description: string;
  priceINR: number;
  priceUSD: number;
  currency: Currency;
  features: string[];
  markedAsPopular: boolean;
  isActive: boolean;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PlanFormData {
  name: string;
  description: string;
  priceINR: number;
  priceUSD: number;
  currency: Currency;
  features: string[];
  status: PlanStatus;
}

export interface SummaryCard {
  label: string;
  value: number;
  color?: string;
}