import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import Header from "./Header.jsx";
import { clearHospitalId, clearToken } from "../services/auth.js";

export default function AppLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    clearHospitalId();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">CAH</span>
          <div>
            <div className="brand-title">Clinical Alert Hub</div>
            <div className="brand-subtitle">Monitoreo</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink to="/" end className="nav-link">
            Panel
          </NavLink>
          <NavLink to="/patients/critical" className="nav-link">
            Pacientes críticos
          </NavLink>
        </nav>
        <button className="button ghost" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </aside>
      <div className="main">
        <Header />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
