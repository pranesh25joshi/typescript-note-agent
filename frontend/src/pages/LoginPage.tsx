import { useState, type FormEvent } from "react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api";

type Mode = "login" | "register";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const switchMode = (next: Mode) => {
    setMode(next);
    setFormError(null);
    setFieldErrors({});
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setFormError(null);
    setFieldErrors({});
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
        const map: Record<string, string> = {};
        for (const fe of err.fieldErrors) map[fe.field] = fe.message;
        setFieldErrors(map);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="ambient" aria-hidden="true">
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="blob blob-c" />
      </div>

      <main className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark msz" aria-hidden="true">
            neurology
          </span>
          <div className="auth-brand-copy">
            <h1 className="brand-name">ThoughtFlow</h1>
            <span className="beta-chip">Beta</span>
          </div>
        </div>

        <h2 className="auth-headline">
          {mode === "login" ? (
            <>
              Welcome back to your <em>notebook.</em>
            </>
          ) : (
            <>
              Create your <em>notebook.</em>
            </>
          )}
        </h2>
        <p className="auth-sub">
          {mode === "login"
            ? "Sign in and let the agent capture, organize and complete your notes."
            : "One account, one agent — notes captured at the speed of thought."}
        </p>

        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={`auth-tab ${mode === "login" ? "active" : ""}`}
            onClick={() => switchMode("login")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "register"}
            className={`auth-tab ${mode === "register" ? "active" : ""}`}
            onClick={() => switchMode("register")}
          >
            Create account
          </button>
        </div>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          {mode === "register" ? (
            <label className="field">
              <span className="field-label">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
                required
              />
              {fieldErrors.name ? (
                <span className="field-error">{fieldErrors.name}</span>
              ) : null}
            </label>
          ) : null}

          <label className="field">
            <span className="field-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            {fieldErrors.email ? (
              <span className="field-error">{fieldErrors.email}</span>
            ) : null}
          </label>

          <label className="field">
            <span className="field-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
            {fieldErrors.password ? (
              <span className="field-error">{fieldErrors.password}</span>
            ) : null}
          </label>

          {formError ? <p className="auth-error">{formError}</p> : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                {mode === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : (
              <>
                <span className="msz" aria-hidden="true">
                  bolt
                </span>
                {mode === "login" ? "Sign in" : "Create account"}
              </>
            )}
          </button>
        </form>

        <p className="auth-foot">
          Your agent session is secured with rotating tokens.
        </p>
      </main>
    </div>
  );
}
