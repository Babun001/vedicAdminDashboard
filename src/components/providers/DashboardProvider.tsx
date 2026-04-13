// components/providers/DashboardProvider.tsx
"use client";

import { useDashboardSync } from "@/hooks/useDashboardSync";

/**
 * Mount this once in your dashboard layout.
 * It silently keeps the Zustand store in sync — no UI rendered.
 */
export function DashboardProvider({ children }: { children: React.ReactNode }) {
  useDashboardSync();
  return <>{children}</>;
}