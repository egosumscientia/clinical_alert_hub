import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import PatientsCritical from "./pages/PatientsCritical.jsx";
import PatientDetail from "./pages/PatientDetail.jsx";
import AppLayout from "./components/AppLayout.jsx";
import { getToken } from "./services/auth.js";

const ProtectedRoute = ({ children }) => {
  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="patients/critical" element={<PatientsCritical />} />
        <Route path="patients/:id" element={<PatientDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
