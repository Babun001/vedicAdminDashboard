import { useState, useEffect, useRef, useCallback } from "react";
import type { Customer } from "@/types";
import axiosInstanceClient from "@/services/client.services";

type SSEState = {
    data: Customer[];
    loading: boolean;
    error: string | null;
    connected: boolean;
};

const SSE_URL = "http://localhost:8080/api/admin/stream";
const LEADS_URL = "http://localhost:8080/api/leads";

console.log("SSE URL:", SSE_URL);
console.log("LEADS URL:", LEADS_URL);

export function useSSE() {
    const [state, setState] = useState<SSEState>({
        data: [],
        loading: true,
        error: null,
        connected: false,
    });

    const esRef = useRef<EventSource | null>(null);

    // Fetch all existing leads on mount
    const fetchInitial = useCallback(async () => {
        try {
            const res = await fetch(LEADS_URL, { credentials: "include" });
            const json = await res.json();
            setState(prev => ({
                ...prev,
                data: json.data?.leads ?? [],
                loading: false,
            }));
        } catch {
            setState(prev => ({ ...prev, loading: false, error: "Failed to load leads" }));
        }
    }, []);

    useEffect(() => {
        fetchInitial();

        // Open SSE connection
        const es = new EventSource(SSE_URL, { withCredentials: true });
        esRef.current = es;

        es.addEventListener("open", () => {
            setState(prev => ({ ...prev, connected: true, error: null }));
        });

        es.addEventListener("new-lead", (e: MessageEvent) => {
            const newLead: Customer = JSON.parse(e.data);
            setState(prev => ({
                ...prev,
                data: [newLead, ...prev.data], // prepend so newest is first
            }));
        });

        es.addEventListener("error", () => {
            setState(prev => ({ ...prev, connected: false, error: "Connection lost. Reconnecting..." }));
        });

        es.addEventListener("open", () => {
            setState(prev => ({ ...prev, connected: true, error: null }));
            fetchInitial(); // ✅ re-sync missed leads on every reconnect
        });

        return () => {
            es.close();
            esRef.current = null;
        };
    }, [fetchInitial]);

    return state;
}