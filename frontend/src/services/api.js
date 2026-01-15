import { clearHospitalId, clearToken, getHospitalId } from "./auth.js";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(getHospitalId() ? { "X-Hospital-Id": getHospitalId() } : {}),
    ...(options.headers || {})
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("La solicitud agotó el tiempo. Revisa tu conexión.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401) {
    clearToken();
    clearHospitalId();
    if (window.location.pathname !== "/login") {
      window.location.replace("/login");
    }
    const message = await response.text();
    throw new Error(message || "No autorizado");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Error en la solicitud");
  }

  return response.json();
}
