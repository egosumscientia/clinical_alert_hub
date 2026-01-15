import React, { useEffect, useState } from "react";
import StatCard from "../components/StatCard.jsx";
import PatientsTable from "../components/PatientsTable.jsx";
import { fetchDashboard } from "../services/clinical.js";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetchDashboard()
      .then((response) => {
        if (active) {
          setData(response);
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
  }, []);

  if (error) {
    return <div className="panel">{error}</div>;
  }

  if (!data) {
    return <div className="panel">Loading dashboard...</div>;
  }

  return (
    <div className="stack">
      <div className="stats-grid">
        <StatCard label="Critical" value={data.totals.critical} tone="critical" />
        <StatCard label="Warning" value={data.totals.warning} tone="warning" />
        <StatCard label="Normal" value={data.totals.normal} tone="normal" />
      </div>

      <div className="panel">
        <div className="panel-title">Patients Overview</div>
        <PatientsTable patients={data.patients} />
      </div>

      <div className="panel">
        <div className="panel-title">Recent Alerts</div>
        <div className="alerts-list">
          {data.alerts.map((alert) => (
            <div key={alert.alert_id} className="alert-row">
              <div>
                <div className="alert-reason">{alert.reason}</div>
                <div className="alert-meta">
                  Patient {alert.patient_id.slice(0, 8)} ? {new Date(alert.created_at).toLocaleString()}
                </div>
              </div>
              <span className={`status-pill ${alert.severity}`}>{alert.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
