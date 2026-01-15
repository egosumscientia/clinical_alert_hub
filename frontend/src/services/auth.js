const TOKEN_KEY = "clinical_alert_hub_token";
const HOSPITAL_KEY = "clinical_alert_hub_hospital";

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem(HOSPITAL_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function setHospitalId(hospitalId) {
  localStorage.setItem(HOSPITAL_KEY, hospitalId);
}

export function getHospitalId() {
  return localStorage.getItem(HOSPITAL_KEY);
}

export function clearHospitalId() {
  localStorage.removeItem(HOSPITAL_KEY);
}
