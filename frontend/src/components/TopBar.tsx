import type { AuthUser } from "../types/api";

type TopBarProps = {
  user: AuthUser;
  onCompose: () => void;
  onLogout: () => void;
};

export const TopBar = ({ user, onCompose, onLogout }: TopBarProps) => (
  <header className="topbar">
    <div>
      <p className="eyebrow">ReachInbox Assignment</p>
      <h1>Email Scheduler Dashboard</h1>
      <p className="subtle-copy">
        Schedule bulk outreach, track queue state, and verify Ethereal deliveries.
      </p>
    </div>

    <div className="topbar-actions">
      <button className="primary-button" onClick={onCompose} type="button">
        Compose New Email
      </button>

      <div className="profile-card">
        {user.avatarUrl ? (
          <img className="avatar" src={user.avatarUrl} alt={user.name} />
        ) : (
          <div className="avatar avatar-fallback">{user.name.slice(0, 1)}</div>
        )}

        <div>
          <strong>{user.name}</strong>
          <span>{user.email}</span>
        </div>

        <button className="ghost-button" onClick={onLogout} type="button">
          Logout
        </button>
      </div>
    </div>
  </header>
);
