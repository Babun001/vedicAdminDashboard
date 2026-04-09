// hooks/useAuthInit.ts
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export function useAuthInit() {
  const { isAuthenticated, isLoading, fetchAdmin } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Always re-validate the cookie with backend on mount
    // This catches expired cookies even if localStorage still has old data
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated]);

  return { isLoading, isAuthenticated };
}