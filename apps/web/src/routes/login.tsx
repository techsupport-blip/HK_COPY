import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ApiError, useApiClient, useAuth } from "@hearth/client";

export function LoginPage() {
  const { login, register } = useAuth();
  const client = useApiClient();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("demo@hearth.app");
  const [password, setPassword] = useState("password123");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "register") {
        await register({ email, password, displayName });
        navigate({ to: "/onboarding" });
      } else {
        await login({ email, password });
        const me = await client.me();
        navigate({ to: me.profile.onboardingComplete ? "/matches" : "/onboarding" });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap card">
      <h1 className="title">
        {mode === "login" ? "Welcome back" : "Join Hearth"}
      </h1>
      <p className="subtitle">
        An AI matchmaker that gets you off the app and into real life.
      </p>
      <form onSubmit={submit}>
        {mode === "register" && (
          <div className="field">
            <label>First name</label>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex"
              required
            />
          </div>
        )}
        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-primary" style={{ width: "100%", marginTop: 8 }} disabled={busy}>
          {busy ? "…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 18, fontSize: 14 }}>
        {mode === "login" ? "New here? " : "Already have an account? "}
        <span
          className="link"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
        >
          {mode === "login" ? "Create an account" : "Sign in"}
        </span>
      </p>
      {mode === "login" && (
        <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
          Demo login is pre-filled — just hit Sign in.
        </p>
      )}
    </div>
  );
}
