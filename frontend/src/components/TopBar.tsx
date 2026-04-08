import type { AuthUser } from "../types/api";

type TopBarProps = {
  user: AuthUser;
  onCompose: () => void;
  onLogout: () => void;
  composeActive?: boolean;
};

const ComposeIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
    <path
      d="M12 5H6.75A1.75 1.75 0 0 0 5 6.75v10.5C5 18.216 5.784 19 6.75 19h10.5c.966 0 1.75-.784 1.75-1.75V12"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
    <path
      d="m9 15 6.75-6.75a1.591 1.591 0 1 1 2.25 2.25L11.25 17H9v-2Z"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
    <path
      d="M10.75 8.75V6.5a1.5 1.5 0 0 1 1.5-1.5h4.25A1.5 1.5 0 0 1 18 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-4.25a1.5 1.5 0 0 1-1.5-1.5v-2.25"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
    <path
      d="M14 12H5.75m0 0 2.5-2.5m-2.5 2.5 2.5 2.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    />
  </svg>
);

export const TopBar = ({ user, onCompose, onLogout, composeActive = false }: TopBarProps) => (
  <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-green-600">
        ReachInbox Assignment
      </p>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          Email Scheduler Dashboard
        </h1>
        <p className="max-w-2xl text-sm text-gray-500 sm:text-base">
          Schedule campaigns, monitor queue activity, and review delivery history from one clean
          workspace.
        </p>
      </div>
    </div>

    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <button
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        onClick={onCompose}
        type="button"
      >
        <ComposeIcon />
        {composeActive ? "Back to Inbox" : "Compose Email"}
      </button>

      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
        {user.avatarUrl ? (
          <img className="h-11 w-11 rounded-full object-cover" src={user.avatarUrl} alt={user.name} />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
          <p className="truncate text-xs text-gray-500">{user.email}</p>
        </div>

        <button
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
          onClick={onLogout}
          type="button"
        >
          <LogoutIcon />
          Logout
        </button>
      </div>
    </div>
  </header>
);
