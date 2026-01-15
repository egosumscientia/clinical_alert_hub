import { apiRequest } from "./api.js";
import { getToken } from "./auth.js";

function withAuth() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function login(email) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email })
  });
}

export function fetchDashboard() {
  return apiRequest("/dashboard", { headers: withAuth() });
}

export function fetchCriticalPatients() {
  return apiRequest("/patients?status=critical", { headers: withAuth() });
}

export function fetchPatient(id) {
  return apiRequest(`/patients/${id}`, { headers: withAuth() });
}
