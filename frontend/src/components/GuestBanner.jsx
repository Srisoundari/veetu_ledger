import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";

export default function GuestBanner() {
  const { t } = useTranslation();
  const { isGuest, logout } = useAuth();

  if (!isGuest) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between">
      <p className="text-xs text-amber-700">{t("auth.guest_banner")}</p>
      <button
        onClick={logout}
        className="text-xs font-medium text-amber-800 underline ml-3 shrink-0"
      >
        {t("auth.sign_up")}
      </button>
    </div>
  );
}
