import { useTranslation } from "react-i18next";

const tabs = [
  { key: "dashboard", icon: "📊", labelKey: "tabs.dashboard" },
  { key: "expenses",  icon: "₹",  labelKey: "tabs.expenses"  },
  { key: "projects",  icon: "🏗", labelKey: "tabs.projects"  },
  { key: "list",      icon: "🛒", labelKey: "tabs.list"      },
  { key: "household", icon: "🏠", label: "Household"         },
];

export default function BottomNav({ active, onChange }) {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-10">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`
            flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5
            text-xs font-medium transition-colors
            ${active === tab.key ? "text-green-600" : "text-gray-400"}
          `}
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span>{tab.labelKey ? t(tab.labelKey) : tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
