import { useAuth } from "../hooks/useAuth";

export default function TopBar({ onHome, onProfile }) {
  const { user, isGuest } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 px-4 py-2.5 flex items-center justify-between z-20 shrink-0">
      <button
        onClick={onHome}
        className="font-bold text-green-600 text-lg tracking-tight"
      >
        VeetuLedger
      </button>

      {!isGuest && user && (
        <button
          onClick={onProfile}
          title={user.email}
          className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-semibold text-sm flex items-center justify-center hover:bg-green-200 transition-colors"
        >
          {user.email?.[0]?.toUpperCase() ?? "U"}
        </button>
      )}
    </header>
  );
}
