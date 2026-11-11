import { initials } from "../lib/format";
import { useAuth } from "../auth/AuthContext";

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-brand">
          <span className="brand-mark msz" aria-hidden="true">
            neurology
          </span>
          <span className="brand-name">ThoughtFlow</span>
          <span className="beta-chip">Beta</span>
        </div>

        <div className="agent-status-pill" title="Agent runtime status">
          <span className="ping-dot">
            <span className="ping-ring" />
            <span className="ping-core" />
          </span>
          <span className="agent-status-label">Agent Connected</span>
          <span className="dot-sep">•</span>
          <span className="agent-status-sub">Session Secured</span>
        </div>

        <div className="topbar-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => void logout()}>
            <span className="msz" aria-hidden="true">
              logout
            </span>
            Sign out
          </button>
          <div className="avatar-wrap" title={user?.email ?? ""}>
            <span className="avatar">{initials(user?.name ?? "U")}</span>
            <span className="avatar-presence" />
          </div>
        </div>
      </div>
    </header>
  );
}
