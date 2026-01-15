import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PaginationControls from "../components/PaginationControls.jsx";
import StatCard from "../components/StatCard.jsx";
import PatientsTable from "../components/PatientsTable.jsx";
import { acknowledgeAlert, fetchDashboard } from "../services/clinical.js";

const PATIENTS_PAGE_SIZE_KEY = "cah_page_size_patients";
const ALERTS_PAGE_SIZE_KEY = "cah_page_size_alerts";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [acknowledging, setAcknowledging] = useState({});
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

  useEffect(() => {
    let active = true;
    fetchDashboard({
      patients_limit: patientsLimit,
      patients_offset: patientsOffset,
      alerts_limit: alertsLimit,
      alerts_offset: alertsOffset,
    })
      .then((response) => {
        if (active) {
          setData(response);
          if (response.patients.page.total > 0 && patientsOffset >= response.patients.page.total) {
            const lastOffset =
              Math.max(0, response.patients.page.total - response.patients.page.limit);
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
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load dashboard");
        }
      });

    return () => {
      active = false;
    };
  }, [patientsLimit, patientsOffset, alertsLimit, alertsOffset]);

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
        <div className="panel-title">Recent Alerts</div>
        {actionError && <div className="error-text">{actionError}</div>}
        <div className="alerts-list">
          {data.alerts.items.map((alert) => (
            <div
              key={alert.alert_id}
              className={`alert-row${alert.is_acknowledged ? " acknowledged" : ""}`}
            >
              <div>
                <div className="alert-reason">{alert.reason}</div>
                <div className="alert-meta">
                  Patient {alert.patient_id.slice(0, 8)} - {new Date(alert.created_at).toLocaleString()}
                </div>
              </div>
              <div className="alert-actions">
                <span className={`status-pill ${alert.severity}`}>{alert.severity}</span>
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
