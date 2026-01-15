import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/clinical.js";
import { setToken } from "../services/auth.js";

export default function Login() {
  const [email, setEmail] = useState("maria.vega@clinic.com");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email);
      setToken(data.access_token);
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <h1>Clinical Alert Hub</h1>
        <p className="auth-subtitle">Sign in to monitor critical patients.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button className="button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="auth-hint">Demo user: maria.vega@clinic.com</div>
      </div>
    </div>
  );
}
