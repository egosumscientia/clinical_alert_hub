import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PaginationControls from "../components/PaginationControls.jsx";
import StatCard from "../components/StatCard.jsx";
import PatientsTable from "../components/PatientsTable.jsx";
import { acknowledgeAlert } from "../services/clinical.js";
import { getHospitalId } from "../services/auth.js";
import useAlertPolling from "../hooks/useAlertPolling.js";
import alertSound from "../assets/alert-critical.wav";

const PATIENTS_PAGE_SIZE_KEY = "cah_page_size_patients";
const ALERTS_PAGE_SIZE_KEY = "cah_page_size_alerts";
const DASHBOARD_CACHE_PREFIX = "cah_dashboard_cache";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acknowledging, setAcknowledging] = useState({});
  const [alertFilter, setAlertFilter] = useState("all");
  const [patientsLimit, setPatientsLimit] = useState(() => {
    const stored = Number(localStorage.getItem(PATIENTS_PAGE_SIZE_KEY));
    return Number.isNaN(stored) || stored <= 0 ? 20 : stored;
  });
  const [alertsLimit, setAlertsLimit] = useState(() => {
    const stored = Number(localStorage.getItem(ALERTS_PAGE_SIZE_KEY));
    return Number.isNaN(stored) || stored <= 0 ? 20 : stored;
  });
  const [patientsOffset, setPatientsOffset] = useState(0);
  const [alertsOffset, setAlertsOffset] = useState(0);
  const [activeHospitalId, setActiveHospitalId] = useState(() => getHospitalId() || "");
  const audioRef = useRef(null);
  const previousAlertIdsRef = useRef(new Set());
  const hasInitializedAlertsRef = useRef(false);

  const pollingParams = useMemo(
    () => ({
      patients_limit: patientsLimit,
      patients_offset: patientsOffset,
      alerts_limit: alertsLimit,
      alerts_offset: alertsOffset,
    }),
    [patientsLimit, patientsOffset, alertsLimit, alertsOffset]
  );
  const cacheKey = useMemo(
    () =>
      `${DASHBOARD_CACHE_PREFIX}:${activeHospitalId}:${patientsLimit}:${patientsOffset}:${alertsLimit}:${alertsOffset}`,
    [activeHospitalId, patientsLimit, patientsOffset, alertsLimit, alertsOffset]
  );

  const handlePollingData = useCallback(
    (response) => {
      setData(response);
      setError("");
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: response, ts: Date.now() }));
      } catch (storageError) {
        // Ignore cache write errors (storage full or disabled).
      }
      if (response.patients.page.total > 0 && patientsOffset >= response.patients.page.total) {
        const lastOffset = Math.max(0, response.patients.page.total - response.patients.page.limit);
        if (lastOffset !== patientsOffset) {
          setPatientsOffset(lastOffset);
        }
      }
      if (response.alerts.page.total > 0 && alertsOffset >= response.alerts.page.total) {
        const lastOffset = Math.max(0, response.alerts.page.total - response.alerts.page.limit);
        if (lastOffset !== alertsOffset) {
          setAlertsOffset(lastOffset);
        }
      }
    },
    [cacheKey, patientsOffset, alertsOffset]
  );

  const { loading, error: pollingError, connected } = useAlertPolling({
    params: pollingParams,
    intervalMs: 30000,
    refreshKey: activeHospitalId,
    onData: handlePollingData,
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw);
      if (parsed?.data) {
        setData(parsed.data);
        setError("");
      }
    } catch (storageError) {
      // Ignore cache read errors.
    }
  }, [cacheKey]);

  useEffect(() => {
    const handleHospitalChange = () => {
      setActiveHospitalId(getHospitalId() || "");
    };
    window.addEventListener("cah-hospital-change", handleHospitalChange);
    return () => {
      window.removeEventListener("cah-hospital-change", handleHospitalChange);
    };
  }, []);

  useEffect(() => {
    setData(null);
    setError("");
  }, [activeHospitalId]);

  useEffect(() => {
    audioRef.current = new Audio(alertSound);
    audioRef.current.preload = "auto";
    return () => {
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!data?.alerts?.items) {
      return;
    }

    const currentIds = new Set(data.alerts.items.map((alert) => alert.alert_id));
    if (!hasInitializedAlertsRef.current) {
      hasInitializedAlertsRef.current = true;
      previousAlertIdsRef.current = currentIds;
      return;
    }

    const hasNewCritical = data.alerts.items.some(
      (alert) =>
        String(alert.severity).toLowerCase() === "critical" &&
        !alert.is_acknowledged &&
        !previousAlertIdsRef.current.has(alert.alert_id)
    );

    if (hasNewCritical && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => { });
    }

    previousAlertIdsRef.current = currentIds;
  }, [data?.alerts?.items]);

  useEffect(() => {
    if (pollingError && !data) {
      setError(pollingError);
    }
  }, [pollingError, data]);

  // Move this logic up before conditional returns
  const alerts = data?.alerts?.items || [];

  const filteredAlerts = useMemo(() => {
    const normalizedFilter = alertFilter.toLowerCase();
    const severityRank = (severity) => {
      const value = String(severity || "").toLowerCase();
      if (value === "critical") return 0;
      if (value === "high") return 1;
      if (value === "warning") return 1;
      if (value === "medium") return 2;
      if (value === "normal") return 3;
      if (value === "low") return 3;
      return 4;
    };

    let result = alerts;
    if (normalizedFilter === "critical") {
      result = alerts.filter((alert) => String(alert.severity).toLowerCase() === "critical");
    }
    if (normalizedFilter === "unacknowledged") {
      result = alerts.filter((alert) => !alert.is_acknowledged);
    }

    return [...result].sort((a, b) => {
      const severityDelta = severityRank(a.severity) - severityRank(b.severity);
      if (severityDelta !== 0) {
        return severityDelta;
      }
      const timeA = Date.parse(a.created_at || "") || 0;
      const timeB = Date.parse(b.created_at || "") || 0;
      return timeB - timeA;
    });
  }, [alerts, alertFilter]);

  if (error) {
    return <div className="panel">{error}</div>;
  }

  if (!data) {
    return <div className="panel">Loading dashboard...</div>;
  }

  const handleAcknowledge = async (alertId) => {
    setActionError("");
    setAcknowledging((prev) => ({ ...prev, [alertId]: true }));
    try {
      const response = await acknowledgeAlert(alertId);
      setData((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          alerts: prev.alerts.map((alert) =>
            alert.alert_id === alertId
              ? { ...alert, is_acknowledged: response.is_acknowledged }
              : alert
          )
        };
      });
    } catch (err) {
      setActionError(err.message || "Failed to acknowledge alert");
    } finally {
      setAcknowledging((prev) => ({ ...prev, [alertId]: false }));
    }
  };

  return (
    <div className="stack">
      <div className="stats-grid">
        <StatCard label="Critical" value={data.totals.critical} tone="critical" />
        <StatCard label="Warning" value={data.totals.warning} tone="warning" />
        <StatCard label="Normal" value={data.totals.normal} tone="normal" />
      </div>

      <div className="connection-banner">
        <span className={`connection-indicator ${connected ? "online" : "offline"}`} />
        <span className="connection-text">{connected ? "Conectado" : "Desconectado"}</span>
        {pollingError && <span className="connection-detail">{pollingError}</span>}
      </div>

      <div className="panel">
        <div className="panel-title">Patients Overview</div>
        <PatientsTable patients={data.patients.items} />
        <PaginationControls
          total={data.patients.page.total}
          limit={data.patients.page.limit}
          offset={data.patients.page.offset}
          onPageChange={setPatientsOffset}
          onLimitChange={(value) => {
            localStorage.setItem(PATIENTS_PAGE_SIZE_KEY, String(value));
            setPatientsLimit(value);
            setPatientsOffset(0);
          }}
        />
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Recent Alerts</div>
          <div className="alert-filters">
            <button
              type="button"
              className={`filter-button ${alertFilter === "all" ? "active" : ""}`}
              onClick={() => setAlertFilter("all")}
            >
              Todos
            </button>
            <button
              type="button"
              className={`filter-button ${alertFilter === "critical" ? "active" : ""}`}
              onClick={() => setAlertFilter("critical")}
            >
              Críticos
            </button>
            <button
              type="button"
              className={`filter-button ${alertFilter === "unacknowledged" ? "active" : ""}`}
              onClick={() => setAlertFilter("unacknowledged")}
            >
              Sin Atender
            </button>
          </div>
        </div>
        {actionError && <div className="error-text">{actionError}</div>}
        <div className="alerts-list">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`alert-row${alert.is_acknowledged ? " acknowledged" : ""}${!alert.is_acknowledged && String(alert.severity).toLowerCase() === "critical"
                  ? " blink-critical"
                  : ""
                }`}
            >
              <div>
                <div className="alert-reason">{alert.reason}</div>
                <div className="alert-meta">
                  Patient {alert.patient_id.slice(0, 8)} - {new Date(alert.created_at).toLocaleString()}
                </div>
              </div>
              <div className="alert-actions">
                <span className={`status-pill ${String(alert.severity).toLowerCase()}`}>
                  {alert.severity}
                </span>
                <Link className="alert-button" to={`/patients/${alert.patient_id}`}>
                  View
                </Link>
                {alert.is_acknowledged ? (
                  <span className="alert-note">Acknowledged</span>
                ) : (
                  <button
                    className="alert-button primary"
                    type="button"
                    disabled={Boolean(acknowledging[alert.alert_id])}
                    onClick={() => handleAcknowledge(alert.alert_id)}
                  >
                    {acknowledging[alert.alert_id] ? "Acknowledging..." : "Acknowledge"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <PaginationControls
          total={data.alerts.page.total}
          limit={data.alerts.page.limit}
          offset={data.alerts.page.offset}
          onPageChange={setAlertsOffset}
          onLimitChange={(value) => {
            localStorage.setItem(ALERTS_PAGE_SIZE_KEY, String(value));
            setAlertsLimit(value);
            setAlertsOffset(0);
          }}
        />
      </div>
    </div>
  );
}
