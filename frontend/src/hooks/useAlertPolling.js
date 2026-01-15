import { useEffect, useMemo, useRef, useState } from "react";
import { fetchDashboard } from "../services/clinical.js";

export default function useAlertPolling({
  params = {},
  intervalMs = 30000,
  timeoutMs = 10000,
  enabled = true,
  fetcher = fetchDashboard,
  refreshKey = "",
  onData,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(true);
  const intervalRef = useRef(null);
  const inFlightRef = useRef(false);
  const requestIdRef = useRef(0);
  const sessionIdRef = useRef(0);
  const paramsKey = useMemo(
    () => JSON.stringify({ params: params || {}, refreshKey }),
    [params, refreshKey]
  );

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let cancelled = false;
    const sessionId = ++sessionIdRef.current;
    inFlightRef.current = false;

    const poll = async () => {
      if (inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      const requestId = ++requestIdRef.current;
      let didTimeout = false;
      const timeoutId = setTimeout(() => {
        if (requestIdRef.current !== requestId) {
          return;
        }
        didTimeout = true;
        setConnected(false);
        setError("Tiempo de espera del backend");
        setLoading(false);
        inFlightRef.current = false;
      }, timeoutMs);
      try {
        const response = await fetcher(params);
        clearTimeout(timeoutId);
        if (cancelled) {
          return;
        }
        if (sessionIdRef.current !== sessionId) {
          return;
        }
        if (didTimeout) {
          return;
        }
        setConnected(true);
        setError("");
        setLoading(false);
        onData?.(response);
      } catch (err) {
        clearTimeout(timeoutId);
        if (cancelled) {
          return;
        }
        if (didTimeout) {
          return;
        }
        setConnected(false);
        setError(err?.message || "Error al actualizar");
        setLoading(false);
      } finally {
        if (!didTimeout) {
          inFlightRef.current = false;
        }
      }
    };

    poll();
    intervalRef.current = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs, timeoutMs, fetcher, paramsKey, onData, params]);

  return { loading, error, connected };
}
