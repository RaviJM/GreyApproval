import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { apiFetch } from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (localStorage.getItem("operatorToken")) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiFetch("/api/operator/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed.");
      }

      localStorage.setItem("operatorToken", data.token);
      localStorage.setItem("operatorUsername", data.username);

      navigate("/", { replace: true });
    } catch (error) {
      setError(error.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="brand-mark">B</div>

        <p className="eyebrow">BETXDEPOSIT</p>
        <h1>Operator login</h1>
        <p className="muted">Sign in to manage payment transactions.</p>

        <label htmlFor="username">Username</label>
        <input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="error-message">{error}</p>}

        <button
          className="button button-primary login-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="login-note">Authorized operators only</p>
      </form>
    </main>
  );
}
