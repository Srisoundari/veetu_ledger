import { useAuth } from "../hooks/useAuth";

export default function TopBar({ onHome, onProfile, dark, onToggleTheme }) {
  const { user, isGuest } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between z-20 shrink-0 dark:bg-slate-900 dark:border-slate-800">
      <button
        onClick={onHome}
        className="font-bold text-slate-900 text-lg tracking-tight dark:text-white"
      >
        VeetuLedger
      </button>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? "☀" : "☾"}
        </button>

        {!isGuest && user && (
          <button
            onClick={onProfile}
            title={user.email}
            className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-semibold text-sm flex items-center justify-center hover:bg-teal-200 transition-colors dark:bg-teal-800 dark:text-teal-200 dark:hover:bg-teal-700"
          >
            {user.email?.[0]?.toUpperCase() ?? "U"}
          </button>
        )}
      </div>
    </header>
  );
}
