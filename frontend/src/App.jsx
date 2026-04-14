import { useTranslation } from "react-i18next";

export default function App() {
  const { t, i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language === "en" ? "ta" : "en";
    i18n.changeLanguage(next);
    localStorage.setItem("lang", next);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold text-green-700">{t("app_name")}</h1>
      <p className="text-gray-500 text-sm">Phase 1 — scaffold running ✓</p>
      <button
        onClick={toggleLang}
        className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium"
      >
        {i18n.language === "en" ? "தமிழ்" : "English"}
      </button>
    </div>
  );
}
