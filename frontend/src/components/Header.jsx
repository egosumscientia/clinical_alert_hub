import React from "react";

export default function Header() {
  return (
    <header className="header">
      <div className="header-title">Live Clinical Overview</div>
      <div className="header-filters">
        <div className="filter-pill">Hospital: Central Clinic</div>
        <div className="filter-pill">Last 24h</div>
      </div>
    </header>
  );
}
