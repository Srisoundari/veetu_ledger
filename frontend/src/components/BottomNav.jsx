import { useTranslation } from "react-i18next";

const tabs = [
  { key: "dashboard", icon: "◈", labelKey: "tabs.dashboard", pill: "bg-indigo-600" },
  { key: "finance",   icon: "₹", label: "Finance",           pill: "bg-teal-600"   },
  { key: "list",      icon: "≡", labelKey: "tabs.list",      pill: "bg-teal-600"   },
  { key: "household", icon: "⌂", label: "Household",         pill: "bg-rose-500"   },
];

export default function BottomNav({ active, onChange }) {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex z-10 dark:bg-slate-900 dark:border-slate-800">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-1"
          >
            {/* Icon with pill background when active */}
            <div className={`
              w-9 h-7 flex items-center justify-center rounded-2xl
              text-base font-bold transition-all duration-200
              ${isActive ? `${tab.pill} text-white` : "text-slate-400"}
            `}>
              {tab.icon}
            </div>
            <span className={`text-[10px] font-medium transition-colors
              ${isActive ? "text-slate-700 dark:text-slate-200" : "text-slate-400"}`}>
              {tab.labelKey ? t(tab.labelKey) : tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
