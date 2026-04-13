// hooks/useDashboardSync.ts
"use client";

/**
 * Call this hook once — ideally in your root layout or a provider.
 * It feeds SSE / fetch data into the Zustand store so stats stay live.
 */

import { useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useSSE } from "@/hooks/useSSE"; // your existing SSE hook

export function useDashboardSync() {
  const { setCustomers } = useDashboardStore();
  const { data: customers } = useSSE();

  // Sync customers (from SSE) into the store whenever they change
  useEffect(() => {
    if (customers?.length) {
      setCustomers(customers);
    }
  }, [customers, setCustomers]);

  // If you fetch users/reports separately, add them here:
  // useEffect(() => { setUsers(fetchedUsers); }, [fetchedUsers]);
  // useEffect(() => { setReports(fetchedReports); }, [fetchedReports]);
}