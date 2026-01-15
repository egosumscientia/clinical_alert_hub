import React from "react";

export default function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card ${tone || ""}`.trim()}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
