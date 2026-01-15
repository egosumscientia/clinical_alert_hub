import { clearHospitalId, clearToken, getHospitalId } from "./auth.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(getHospitalId() ? { "X-Hospital-Id": getHospitalId() } : {}),
    ...(options.headers || {})
  };
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearToken();
    clearHospitalId();
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
    const message = await response.text();
    throw new Error(message || "Unauthorized");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }

  return response.json();
}
