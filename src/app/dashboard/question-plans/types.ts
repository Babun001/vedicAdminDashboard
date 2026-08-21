export interface QuestionPlan {
  _id: string;
  name: string;
  description: string;
  questionCount: number;
  priceINR: number;
  priceUSD: number;
  validityDays: number;
  features: string[];
  markedAsPopular: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionPlanFormData {
  name: string;
  description: string;
  questionCount: number;
  priceINR: number;
  priceUSD: number;
  validityDays: number;
  features: string[];
  isActive: boolean;
}

export interface SummaryCard {
  label: string;
  value: number;
  color?: string;
}