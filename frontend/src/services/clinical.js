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

export function fetchDashboard(params = {}) {
  const query = new URLSearchParams(params).toString();
  const path = query ? `/dashboard?${query}` : "/dashboard";
  return apiRequest(path, { headers: withAuth() });
}

export function fetchCriticalPatients(params = {}) {
  const query = new URLSearchParams({ status: "critical", ...params }).toString();
  return apiRequest(`/patients?${query}`, { headers: withAuth() });
}

export function fetchPatient(id) {
  return apiRequest(`/patients/${id}`, { headers: withAuth() });
}

export function acknowledgeAlert(alertId) {
  return apiRequest(`/alerts/${alertId}/ack`, {
    method: "POST",
    headers: withAuth()
  });
}

export function fetchHospitals() {
  return apiRequest("/hospitals", { headers: withAuth() });
}
